import { useState } from "react";
import { FaFilePdf, FaFileExcel, FaChartLine } from "react-icons/fa";
import { getMyRequests } from "../../services/hospitalService";
import { generateHospitalRequestPDF, generateExcel } from "../../utils/reportGenerator";
import toast from "react-hot-toast";

const HospitalReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  
  // ✅ Filters now include startDate and endDate for custom range
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    startDate: "",
    endDate: ""
  });

  // ✅ Filter requests based on the selected report type and date range
  const filterRequestsByDate = (requests, type, filterParams) => {
    return requests.filter((req) => {
      const requestDate = new Date(req.createdAt);

      if (type === "monthly") {
        const year = parseInt(filterParams.year);
        const month = parseInt(filterParams.month);
        return (
          requestDate.getFullYear() === year &&
          requestDate.getMonth() === month
        );
      } else if (type === "yearly") {
        const year = parseInt(filterParams.year);
        return requestDate.getFullYear() === year;
      } else if (type === "custom") {
        // Build start of day for startDate and end of day for endDate
        const start = new Date(filterParams.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filterParams.endDate);
        end.setHours(23, 59, 59, 999);
        return requestDate >= start && requestDate <= end;
      }

      return true;
    });
  };

  const handleDownload = async (format) => {
    // Basic validation for custom dates
    if (reportType === "custom" && (!filters.startDate || !filters.endDate)) {
      toast.error("Please select both Start and End dates");
      return;
    }

    setLoading(true);
    try {
      const response = await getMyRequests(); 
      if (response.success) {
        // ✅ Filter the requests by the selected date range BEFORE generating the report
        const filteredRequests = filterRequestsByDate(response.requests, reportType, filters);

        if (filteredRequests.length === 0) {
          toast.error("No records found for the selected date range");
          setLoading(false);
          return;
        }

        // Combining report type with all filters for the generator
        const reportParams = { type: reportType, ...filters };
        
        if (format === "pdf") {
          generateHospitalRequestPDF(filteredRequests, reportParams);
        } else {
          const excelData = filteredRequests.map(req => ({
            Date: new Date(req.createdAt).toLocaleDateString(),
            Group: req.bloodGroup,
            Units: req.units,
            Urgency: req.urgencyLevel,
            Status: req.status,
            Source: req.respondedBy?.responderId?.name || req.respondedBy?.responderId?.fullName || "Unfulfilled"
          }));
          generateExcel(excelData, "Hospital_Audit_Report");
        }
        toast.success("Report Generated Successfully!");
      }
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
          <FaChartLine size={24} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Hospital Audit Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Official blood requirement and fulfillment history.</p>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Audit Scope Selection */}
        <div className="mb-6 sm:mb-8">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">
            Audit Scope
          </label>
          <div className="grid grid-cols-3 sm:flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full sm:w-fit gap-1">
            {["monthly", "yearly", "custom"].map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-3 sm:px-6 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase transition-all ${
                  reportType === t 
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 shadow-sm" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Filter Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Year selection for Monthly/Yearly */}
          {(reportType === "monthly" || reportType === "yearly") && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Year</label>
              <select 
                value={filters.year} 
                onChange={e => setFilters({...filters, year: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {/* Month selection for Monthly */}
          {reportType === "monthly" && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Month</label>
              <select 
                value={filters.month} 
                onChange={e => setFilters({...filters, month: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Date Range selection */}
          {reportType === "custom" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Start Date</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">End Date</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button 
            onClick={() => handleDownload("pdf")} 
            disabled={loading} 
            className="w-full sm:flex-1 py-3.5 sm:py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <FaFilePdf /> {loading ? "Generating..." : "Download PDF Audit"}
          </button>
          <button 
            onClick={() => handleDownload("excel")} 
            disabled={loading} 
            className="w-full sm:flex-1 py-3.5 sm:py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <FaFileExcel /> {loading ? "Processing..." : "Export Excel Sheet"}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <p className="text-center text-xs text-gray-400">
        All reports include timestamps and fulfillment source details for audit compliance.
      </p>
    </div>
  );
};

export default HospitalReports;