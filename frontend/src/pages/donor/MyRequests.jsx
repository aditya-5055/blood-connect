import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaHandHoldingHeart, FaPhone, FaCalendarAlt, FaClock, FaCheck, FaTimes, FaTrashAlt } from "react-icons/fa";
import { MdLocationOn, MdPhone } from "react-icons/md";
import { getMyDonationRequests, updateDonationRequestStatus, cancelDonationRequest } from "../../services/donorService";
// ✅ Import your Modal component (check path)
import ConfirmationModal from "../../components/common/ConfirmationModal";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // ✅ New States for Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getMyDonationRequests();
      const activeRequests = (response.donationRequests || []).filter(
        (r) => ["pending", "invited", "confirmed"].includes(r.status)
      );
      setRequests(activeRequests);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Modified: Opens modal instead of using window.confirm
  const handleCancelClick = (requestId) => {
    setSelectedRequestId(requestId);
    setShowModal(true);
  };

  // ✅ New: Function triggered when user clicks "Yes" in Modal
  const handleConfirmCancel = async () => {
    if (!selectedRequestId) return;
    
    setActionLoading(selectedRequestId);
    setShowModal(false); // Close modal immediately
    try {
      const response = await cancelDonationRequest(selectedRequestId);
      if (response.success) {
        toast.success("Request cancelled");
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel");
    } finally {
      setActionLoading(null);
      setSelectedRequestId(null);
    }
  };

  const handleAppointmentAction = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      const response = await updateDonationRequestStatus(requestId, { action });
      if (response.success) {
        toast.success(`Appointment ${action === 'confirmed' ? 'confirmed' : 'declined'}!`);
        fetchRequests();
      }
    } catch (error) {
      toast.error("Action failed");
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
    <div className="max-w-5xl mx-auto p-4 sm:p-5 space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 via-white to-orange-50 dark:from-red-900/20 dark:via-gray-800 dark:to-orange-900/20 p-4 sm:p-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Active Requests</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Track your donation requests and appointment status in one place.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-10 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaHandHoldingHeart className="text-red-600 dark:text-red-300 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No active requests</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">You are free to request a donation.</p>
          <a href="/donor/nearby-banks" className="inline-flex items-center justify-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all">
            Find Banks →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <FaTint className="text-red-600 dark:text-red-300 text-xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg break-words">{request.bloodBankId?.name}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            request.status === 'invited' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        }`}>
                            {request.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">#{request._id.slice(-6)}</span>
                    </div>
                  </div>
                </div>

                {request.status !== "confirmed" && (
                  <button
                    onClick={() => handleCancelClick(request._id)} // ✅ Using Modal Trigger
                    disabled={actionLoading === request._id}
                    className="self-start sm:self-auto flex items-center gap-2 text-red-500 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all text-xs font-bold border border-transparent hover:border-red-100 dark:hover:border-red-800/50"
                  >
                    <FaTrashAlt />
                    {actionLoading === request._id ? "..." : "Cancel Request"}
                  </button>
                )}
              </div>

              {/* ... [Rest of your Status Specific UI (invited/confirmed)] ... */}
              {request.status === "invited" && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800/50 mb-4 space-y-4">
                  {/* ... Existing Invited UI code ... */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                        onClick={() => handleAppointmentAction(request._id, "confirmed")}
                        className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-700 transition-all"
                    >
                        Accept Appointment
                    </button>
                    <button 
                        onClick={() => handleAppointmentAction(request._id, "declined")}
                        className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-purple-200 text-purple-600 font-bold rounded-xl text-xs hover:bg-purple-50 transition-all"
                    >
                        Decline
                    </button>
                  </div>
                </div>
              )}

              {request.status === "confirmed" && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl border border-green-100 dark:border-green-800/50 flex items-center gap-3">
                   <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">✅</div>
                   <div>
                        <p className="font-bold text-sm">Appointment Confirmed!</p>
                        <p className="text-[11px] opacity-80">See you on {new Date(request.appointmentDate).toDateString()} at {request.slotTime}</p>
                   </div>
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-500 dark:text-gray-400 text-xs">
                    <div className="flex items-center gap-2"><MdPhone className="text-gray-400"/> {request.bloodBankId?.phone}</div>
                    <div className="flex items-center gap-2"><MdLocationOn className="text-gray-400"/> {request.bloodBankId?.address?.city}</div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ ADD THE CUSTOM MODAL HERE */}
      <ConfirmationModal
        isOpen={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Donation Request?"
        message="Are you sure you want to cancel this request? This will allow you to contact other blood banks immediately."
        confirmText="Yes, Cancel"
      />
    </div>
  );
};

export default MyRequests;