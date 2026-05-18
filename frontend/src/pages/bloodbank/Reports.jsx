import { useState, useEffect } from "react";
import { FaCampground, FaUserCheck, FaHospitalSymbol, FaFilePdf, FaFileExcel } from "react-icons/fa";
import { getProactiveReportData, getCampReportData, getInventoryReportData } from "../../services/reportService";
import { 
  generateProactivePDF, 
  generateCampPDF, 
  generateInventoryPDF, 
  generateExcel, 
  generateDetailedCampPDF 
} from "../../utils/reportGenerator";
import toast from "react-hot-toast";

const Reports = () => {
  const [activeModule, setActiveModule] = useState("proactive");
  const [loading, setLoading] = useState(false);
  const [campList, setCampList] = useState([]);

  const [reportType, setReportType] = useState("monthly");
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    startDate: "",
    endDate: ""
  });

  // Fetch camps whenever filters change or active module is camp
  useEffect(() => {
    const fetchCamps = async () => {
      const res = await getCampReportData();
      if (res.success) setCampList(res.reportData);
    };
    fetchCamps();
  }, [activeModule]);

  // Helper to convert Address Object to String to prevent React crash
  const renderAddress = (addr) => {
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object' && addr !== null) {
      return `${addr.street || ""}, ${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}`;
    }
    return "No Address";
  };

  const handleDetailedAudit = (camp) => {
    const stats = {
      totalRegistered: camp.registeredDonors?.length || 0,
      actualDonations: camp.registeredDonors?.filter(d => d.status === "donated").length || 0,
      inventorySummary: {
        "A+": 0, "A-": 0, "B+": 0, "B-": 0, "O+": 0, "O-": 0, "AB+": 0, "AB-": 0
      }
    };
    camp.registeredDonors?.forEach(d => {
      if(d.status === "donated" && d.donorId?.bloodGroup) {
        stats.inventorySummary[d.donorId.bloodGroup]++;
      }
    });
    generateDetailedCampPDF(camp, stats);
  };

  // ✅ Client-side date filter for camp data (and as safety net for others)
  const filterByDate = (items, dateField, type, filterParams) => {
    return items.filter((item) => {
      const itemDate = new Date(item[dateField]);

      if (type === "daily") {
        const today = new Date();
        return (
          itemDate.getFullYear() === today.getFullYear() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getDate() === today.getDate()
        );
      } else if (type === "monthly") {
        const year = parseInt(filterParams.year);
        const month = parseInt(filterParams.month);
        return itemDate.getFullYear() === year && itemDate.getMonth() === month;
      } else if (type === "yearly") {
        const year = parseInt(filterParams.year);
        return itemDate.getFullYear() === year;
      } else if (type === "custom") {
        const start = new Date(filterParams.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filterParams.endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      }

      return true;
    });
  };

  const handleDownload = async (format) => {
    // Validate custom dates
    if (reportType === "custom" && (!filters.startDate || !filters.endDate)) {
      toast.error("Please select both Start and End dates");
      return;
    }

    setLoading(true);
    try {
      let response;
      const params = { type: reportType, ...filters };

      if (activeModule === "proactive") {
        response = await getProactiveReportData(params);
        if (response.success) {
          const data = response.reportData || [];
          if (data.length === 0) {
            toast.error("No donor records found for the selected date range");
            setLoading(false);
            return;
          }
          if (format === "pdf") generateProactivePDF(data, params);
          else {
            const excelData = data.map(item => ({
              Date: new Date(item.updatedAt).toLocaleDateString(),
              Donor: item.donorId?.fullName, Group: item.bloodGroup, Units: item.units || 1
            }));
            generateExcel(excelData, `Donor_Report_${reportType}`);
          }
        }
      } 
      else if (activeModule === "camp") {
        response = await getCampReportData(); 
        if (response.success) {
          // ✅ Filter camps by campDate based on selected date range
          const filteredCamps = filterByDate(response.reportData, "campDate", reportType, filters);

          if (filteredCamps.length === 0) {
            toast.error("No camp records found for the selected date range");
            setLoading(false);
            return;
          }

          if (format === "pdf") generateCampPDF(filteredCamps, params);
          else {
            const excelData = filteredCamps.map(c => ({
              Date: new Date(c.campDate).toLocaleDateString(), 
              Name: c.name, 
              Location: renderAddress(c.address),
              Donors: c.registeredDonors?.length
            }));
            generateExcel(excelData, "Camp_History");
          }
        }
      } 
      else if (activeModule === "inventory") {
        response = await getInventoryReportData(params);
        if (response.success) {
          const data = response.fulfillments || [];
          if (data.length === 0) {
            toast.error("No inventory records found for the selected date range");
            setLoading(false);
            return;
          }
          if (format === "pdf") generateInventoryPDF(data, params);
          else {
            const excelData = data.map(r => ({
              Date: new Date(r.updatedAt).toLocaleDateString(), Hospital: r.hospitalId?.name, Group: r.bloodGroup
            }));
            generateExcel(excelData, "Inventory_Report");
          }
        }
      }
      toast.success(`${format.toUpperCase()} generated!`);
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <header>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Bank Reports & Analytics</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Professional reporting for government compliance.</p>
      </header>

      {/* 🟢 Module Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReportCard icon={<FaUserCheck className="text-blue-600"/>} title="Donor Requests" active={activeModule === "proactive"} onClick={() => setActiveModule("proactive")} />
        <ReportCard icon={<FaCampground className="text-orange-600"/>} title="Camp Audit" active={activeModule === "camp"} onClick={() => setActiveModule("camp")} />
        <ReportCard icon={<FaHospitalSymbol className="text-red-600"/>} title="Inventory Logs" active={activeModule === "inventory"} onClick={() => setActiveModule("inventory")} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
        
        {/* 🛠 FILTER SELECTION (ALWAYS VISIBLE NOW) */}
        <div className="mb-6 sm:mb-8">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3">Report Period</label>
          <div className="grid grid-cols-2 sm:flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full sm:w-fit gap-1">
            {["daily", "monthly", "yearly", "custom"].map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-3 sm:px-6 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase transition-all ${
                  reportType === t
                    ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-300 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ⚙️ DYNAMIC INPUTS FOR FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {(reportType === "monthly" || reportType === "yearly") && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Year</label>
              <select
                value={filters.year}
                onChange={e => setFilters({...filters, year: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          {reportType === "monthly" && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Month</label>
              <select
                value={filters.month}
                onChange={e => setFilters({...filters, month: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
          )}
          {reportType === "custom" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Start Date</label>
                <input
                  type="date"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </>
          )}
        </div>

        {/* 📥 CAMP LIST DISPLAY (FIXED FOR OBJECTS) */}
        {activeModule === "camp" && (
          <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Individual Camp Detailed Audits</h3>
            <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
              {campList.map(camp => (
                <div key={camp._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{camp.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {new Date(camp.campDate).toLocaleDateString()} • {renderAddress(camp.address)}
                    </p>
                  </div>
                  <button onClick={() => handleDetailedAudit(camp)} className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-xl text-xs font-bold hover:bg-orange-600 hover:text-white transition-all">
                    <FaFilePdf /> Audit PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
          <button
            onClick={() => handleDownload("pdf")}
            disabled={loading}
            className="w-full sm:flex-1 py-3.5 sm:py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <FaFilePdf/> {loading ? "Generating..." : "Full PDF Report"}
          </button>
          <button
            onClick={() => handleDownload("excel")}
            disabled={loading}
            className="w-full sm:flex-1 py-3.5 sm:py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <FaFileExcel/> Full Excel Export
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportCard = ({ icon, title, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-5 sm:p-6 rounded-3xl text-left border-2 transition-all ${
      active
        ? "border-red-500/80 bg-red-50 dark:bg-red-900/20 shadow-sm"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-300 dark:hover:border-red-700"
    }`}
  >
    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-3">{icon}</div>
    <h3 className="font-bold text-gray-800 dark:text-gray-200">{title}</h3>
  </button>
);

export default Reports;