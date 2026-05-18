import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaSearch, FaTint } from "react-icons/fa";
import { MdLocalHospital, MdAccessTime } from "react-icons/md";
import { getAllRequests } from "../../services/adminService";

const AllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");

  const statuses = ["all", "active", "confirmed", "completed", "expired", "cancelled"];
  const urgencies = ["all", "Critical", "High", "Moderate", "Normal"];

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    let result = requests;
    if (filterStatus !== "all") {
      result = result.filter((r) => r.status === filterStatus);
    }
    if (filterUrgency !== "all") {
      result = result.filter((r) => r.urgencyLevel === filterUrgency);
    }
    if (search) {
      result = result.filter(
        (r) =>
          r.hospitalId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.bloodGroup?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, filterStatus, filterUrgency, requests]);

  const fetchRequests = async () => {
    try {
      const response = await getAllRequests();
      setRequests(response.requests || []);
      setFiltered(response.requests || []);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50";
      case "confirmed": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50";
      case "completed": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50";
      case "expired": return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
      case "cancelled": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50";
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Critical": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50";
      case "High": return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50";
      case "Moderate": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50";
      case "Normal": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50";
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 via-white to-violet-50 dark:from-red-900/20 dark:via-gray-800 dark:to-violet-900/20 px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Blood Requests</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Monitor all blood requests in the system</p>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 space-y-4">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by hospital name or blood group..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
        />
      </div>

      {/* Status Filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Filter by Status</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
                filterStatus === status
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Urgency Filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Filter by Urgency</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {urgencies.map((urgency) => (
            <button
              key={urgency}
              onClick={() => setFilterUrgency(urgency)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filterUrgency === urgency
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300"
              }`}
            >
              {urgency}
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Count */}
      <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700">
        {filtered.length} requests found
      </span>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 sm:p-12 text-center">
          <FaTint className="text-gray-300 dark:text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No requests found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try changing your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <div
              key={request._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                {/* Left Side */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaTint className="text-red-600 dark:text-red-300 text-lg" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-lg font-bold text-red-600">{request.bloodGroup}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{request.units} units</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getUrgencyColor(request.urgencyLevel)}`}>
                        {request.urgencyLevel}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold capitalize ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <MdLocalHospital className="text-orange-500" />
                      <span className="break-words">{request.hospitalId?.name || "Unknown Hospital"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                      <MdAccessTime />
                      <span>Posted: {new Date(request.createdAt).toDateString()}</span>
                      {request.completedAt && (
                        <span>• Completed: {new Date(request.completedAt).toDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="sm:text-right">
                  <p className="text-xs text-gray-400">Stage</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    request.stage === "bloodbank"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  }`}>
                    {request.stage}
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllRequests;