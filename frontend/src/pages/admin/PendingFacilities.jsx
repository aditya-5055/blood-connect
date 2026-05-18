import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaHospital, FaCheck, FaTimes, FaTint } from "react-icons/fa";
import { MdLocationOn, MdPhone, MdEmail } from "react-icons/md";
import { getPendingFacilities, approveFacility, rejectFacility } from "../../services/adminService";

const PendingFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ show: false, facilityId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPendingFacilities();
  }, []);

  const fetchPendingFacilities = async () => {
    try {
      const response = await getPendingFacilities();
      setFacilities(response.facilities || []);
    } catch (error) {
      toast.error("Failed to load pending facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const response = await approveFacility(id);
      if (response.success) {
        toast.success("Facility approved successfully!");
        setFacilities(facilities.filter((f) => f._id !== id));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide rejection reason");
      return;
    }
    setActionLoading(rejectModal.facilityId);
    try {
      const response = await rejectFacility(rejectModal.facilityId, rejectionReason);
      if (response.success) {
        toast.success("Facility rejected!");
        setFacilities(facilities.filter((f) => f._id !== rejectModal.facilityId));
        setRejectModal({ show: false, facilityId: null });
        setRejectionReason("");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-yellow-50 via-white to-red-50 dark:from-yellow-900/20 dark:via-gray-800 dark:to-red-900/20 px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pending Facilities</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
          Review and approve or reject facility registrations
        </p>
      </div>

      {/* Count Badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold rounded-full border border-red-200 dark:border-red-800/50">
          {facilities.length} Pending
        </span>
      </div>

      {/* Empty State */}
      {facilities.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 sm:p-12 text-center">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-green-600 dark:text-green-300 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">All caught up!</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No pending facilities to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {facilities.map((facility) => (
            <div key={facility._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all">

              {/* Facility Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    facility.facilityType === "hospital"
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "bg-blue-100 dark:bg-blue-900/30"
                  }`}>
                    {facility.facilityType === "hospital"
                      ? <FaHospital className="text-orange-600 dark:text-orange-300 text-xl" />
                      : <FaTint className="text-blue-600 dark:text-blue-300 text-xl" />
                    }
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 break-words">{facility.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      facility.facilityType === "hospital"
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    }`}>
                      {facility.facilityType}
                    </span>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded-full border border-yellow-200 dark:border-yellow-800/50">
                  Pending
                </span>
              </div>

              {/* Facility Details */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MdEmail className="text-gray-400 flex-shrink-0" />
                  <span className="break-words">{facility.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MdPhone className="text-gray-400 flex-shrink-0" />
                  {facility.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MdLocationOn className="text-gray-400 flex-shrink-0" />
                  <span className="break-words">{facility.address?.city}, {facility.address?.state} - {facility.address?.pincode}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-gray-400 text-xs">Reg No:</span>
                  <span className="font-medium">{facility.registrationNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-gray-400 text-xs">Category:</span>
                  <span className="font-medium">{facility.facilityCategory}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleApprove(facility._id)}
                  disabled={actionLoading === facility._id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  <FaCheck />
                  {actionLoading === facility._id ? "Processing..." : "Approve"}
                </button>
                <button
                  onClick={() => setRejectModal({ show: true, facilityId: facility._id })}
                  disabled={actionLoading === facility._id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  <FaTimes />
                  Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRejectModal({ show: false, facilityId: null })}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Reject Facility</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please provide a reason for rejection. This will be emailed to the facility.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModal({ show: false, facilityId: null });
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-xl transition-all text-sm"
              >
                {actionLoading !== null ? "Rejecting..." : "Reject Facility"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PendingFacilities;