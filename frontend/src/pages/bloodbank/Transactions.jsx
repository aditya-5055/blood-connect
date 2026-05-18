import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { MdFilterList } from "react-icons/md";
import { getTransactions } from "../../services/bloodBankService";
import { BLOOD_GROUPS } from "../../constants/bloodGroups";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    bloodGroup: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (customFilters) => {
    setLoading(true);
    try {
      const activeFilters = customFilters || filters;
      const params = {};
      if (activeFilters.type !== "all") params.type = activeFilters.type;
      if (activeFilters.bloodGroup !== "all") params.bloodGroup = activeFilters.bloodGroup;
      if (activeFilters.startDate) params.startDate = activeFilters.startDate;
      if (activeFilters.endDate) params.endDate = activeFilters.endDate;

      const response = await getTransactions(params);
      setTransactions(response.transactions || []);
      setSummary(response.summary);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTransactions(newFilters);
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case "proactive": return "Proactive Donor";
      case "camp": return "Donation Camp";
      case "walk-in": return "Walk-in Donor";
      case "manual": return "Manual Entry";
      case "hospital": return "Hospital Request";
      default: return source;
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case "proactive": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "camp": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "walk-in": return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      case "manual": return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
      case "hospital": return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Transaction History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">All blood stock movements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FaArrowUp className="text-green-600 dark:text-green-300" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Stock In</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary?.totalStockIn || 0}</p>
          <p className="text-xs text-green-600 dark:text-green-300/90 mt-0.5">units received</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FaArrowDown className="text-red-600 dark:text-red-300" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">Stock Out</span>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary?.totalStockOut || 0}</p>
          <p className="text-xs text-red-600 dark:text-red-300/90 mt-0.5">units dispatched</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FaTint className="text-blue-600 dark:text-blue-300" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Net Units</span>
          </div>
          <p className={`text-2xl font-bold ${
            (summary?.netUnits || 0) >= 0 ? "text-blue-700 dark:text-blue-300" : "text-red-700 dark:text-red-300"
          }`}>
            {summary?.netUnits || 0}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300/90 mt-0.5">current balance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <MdFilterList className="text-gray-500 dark:text-gray-400" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Type Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Types</option>
              <option value="stock-in">Stock In</option>
              <option value="stock-out">Stock Out</option>
            </select>
          </div>

          {/* Blood Group Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Blood Group</label>
            <select
              value={filters.bloodGroup}
              onChange={(e) => handleFilterChange("bloodGroup", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

        </div>

        {/* Reset Filters */}
        {(filters.type !== "all" || filters.bloodGroup !== "all" || filters.startDate || filters.endDate) && (
          <button
            onClick={() => {
              const reset = { type: "all", bloodGroup: "all", startDate: "", endDate: "" };
              setFilters(reset);
              fetchTransactions(reset);
            }}
            className="mt-3 text-xs text-red-600 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Count */}
      <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full">
        {transactions.length} transactions found
      </span>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FaTint className="text-gray-300 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No transactions found</h3>
          <p className="text-gray-400 text-sm mt-1">Try changing your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all border-l-4 ${
                tx.transactionType === "stock-in" ? "border-green-400" : "border-red-400"
              }`}
            >
              <div className="flex items-start gap-4">

                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.transactionType === "stock-in"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}>
                  {tx.transactionType === "stock-in"
                    ? <FaArrowUp className="text-green-600 dark:text-green-300" />
                    : <FaArrowDown className="text-red-600 dark:text-red-300" />
                  }
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${
                        tx.transactionType === "stock-in" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                      }`}>
                        {tx.transactionType === "stock-in" ? "+" : "-"}{tx.units} units
                      </span>
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full font-bold">
                        {tx.bloodGroup}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getSourceColor(tx.source)}`}>
                        {getSourceLabel(tx.source)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Extra Info */}
                  <div className="mt-1 space-y-0.5">
                    {tx.donorId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        👤 Donor: {tx.donorId?.fullName} • {tx.donorId?.phone}
                      </p>
                    )}
                    {tx.hospitalId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        🏥 Hospital: {tx.hospitalId?.name}
                      </p>
                    )}
                    {tx.campId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        🏕️ Camp: {tx.campId?.name}
                      </p>
                    )}
                    {tx.reason && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📝 Reason: {tx.reason}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Transactions;