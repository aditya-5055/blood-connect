import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaHospital, FaUsers, FaTint } from "react-icons/fa";
import { MdApproval, MdBloodtype } from "react-icons/md";
import { getPendingFacilities, getAllDonors, getAllFacilities, getAllRequests } from "../../services/adminService";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    pendingFacilities: 0,
    totalDonors: 0,
    totalFacilities: 0,
    totalRequests: 0,
  });
  const [pendingFacilities, setPendingFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [pending, donors, facilities, requests] = await Promise.all([
        getPendingFacilities(),
        getAllDonors(),
        getAllFacilities(),
        getAllRequests(),
      ]);

      setStats({
        pendingFacilities: pending.count || 0,
        totalDonors: donors.count || 0,
        totalFacilities: facilities.count || 0,
        totalRequests: requests.count || 0,
      });

      // Show only latest 5 pending
      setPendingFacilities(pending.facilities?.slice(0, 5) || []);

    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 via-white to-rose-50 dark:from-red-900/20 dark:via-gray-800 dark:to-rose-900/20 px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {user?.name || "Blood Donation Admin"} 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
          Here's what's happening in BloodConnect today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.pendingFacilities}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <MdApproval className="text-red-600 dark:text-red-300 text-2xl" />
            </div>
          </div>
          <Link to="/admin/pending-facilities" className="text-xs text-red-600 dark:text-red-300 font-semibold mt-3 inline-block hover:underline">
            View all →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalDonors}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <FaUsers className="text-green-600 dark:text-green-300 text-2xl" />
            </div>
          </div>
          <Link to="/admin/donors" className="text-xs text-green-600 dark:text-green-300 font-semibold mt-3 inline-block hover:underline">
            View all →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Facilities</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalFacilities}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <FaHospital className="text-blue-600 dark:text-blue-300 text-2xl" />
            </div>
          </div>
          <Link to="/admin/manage-facilities" className="text-xs text-blue-600 dark:text-blue-300 font-semibold mt-3 inline-block hover:underline">
            View all →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalRequests}</p>
            </div>
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <MdBloodtype className="text-violet-600 dark:text-violet-300 text-2xl" />
            </div>
          </div>
          <Link to="/admin/requests" className="text-xs text-violet-600 dark:text-violet-300 font-semibold mt-3 inline-block hover:underline">
            View all →
          </Link>
        </div>

      </div>

      {/* Pending Facilities */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Pending Approvals
          </h2>
          <Link
            to="/admin/pending-facilities"
            className="text-sm text-red-600 dark:text-red-300 font-semibold hover:underline"
          >
            View All →
          </Link>
        </div>

        {pendingFacilities.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <MdApproval className="text-gray-300 dark:text-gray-600 text-5xl mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingFacilities.map((facility) => (
              <div
                key={facility._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    facility.facilityType === "hospital"
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "bg-blue-100 dark:bg-blue-900/30"
                  }`}>
                    {facility.facilityType === "hospital"
                      ? <FaHospital className="text-orange-600 dark:text-orange-300" />
                      : <FaTint className="text-blue-600 dark:text-blue-300" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{facility.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{facility.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    facility.facilityType === "hospital"
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  }`}>
                    {facility.facilityType}
                  </span>
                  <Link
                    to="/admin/pending-facilities"
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;