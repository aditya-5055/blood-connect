import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaHandHoldingHeart, FaCalendarAlt, FaClock, FaTrashAlt } from "react-icons/fa";
import { MdLocationOn, MdPhone } from "react-icons/md";
import { getMyDonationRequests, cancelDonationRequest } from "../../services/donorService";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal States
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
        (r) => ["booked"].includes(r.status)
      );
      setRequests(activeRequests);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (requestId) => {
    setSelectedRequestId(requestId);
    setShowModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedRequestId) return;
    
    setActionLoading(selectedRequestId);
    setShowModal(false); 
    try {
      const response = await cancelDonationRequest(selectedRequestId);
      if (response.success) {
        toast.success("Booking cancelled successfully");
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel booking");
    } finally {
      setActionLoading(null);
      setSelectedRequestId(null);
    }
  };

  const isCancellationAllowed = (booking) => {
    if (!booking?.slotId) return false;
    const slotStart = new Date(booking.slotId.date);
    const [hours, minutes] = booking.slotId.startTime.split(":").map(Number);
    slotStart.setHours(hours, minutes, 0, 0);
    const cutoffTime = slotStart.getTime() - 6 * 60 * 60 * 1000;
    return Date.now() < cutoffTime;
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Active Bookings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Track and manage your upcoming donation slot appointments in one place.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-10 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaHandHoldingHeart className="text-red-600 dark:text-red-300 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No active bookings</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">You do not have any upcoming appointment slots booked.</p>
          <a href="/donor/nearby-banks" className="inline-flex items-center justify-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm">
            Book a Slot →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const canCancel = isCancellationAllowed(request);
            return (
              <div key={request._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FaTint className="text-red-600 dark:text-red-300 text-xl" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg break-words">{request.bloodBankId?.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          {request.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">#{request._id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelClick(request._id)} 
                    disabled={!canCancel || actionLoading === request._id}
                    title={!canCancel ? "Cancellation locked (within 6h of slot start)" : ""}
                    className={`self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-bold border border-transparent ${
                      canCancel 
                        ? "text-red-500 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 dark:hover:border-red-800/50" 
                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-900/50"
                    }`}
                  >
                    <FaTrashAlt />
                    {actionLoading === request._id ? "..." : "Cancel Appointment"}
                  </button>
                </div>

                {request.slotId && (
                  <div className="bg-red-50/30 dark:bg-red-900/10 rounded-2xl p-4 border border-red-100/50 dark:border-red-900/30 mb-4 space-y-3">
                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <FaCalendarAlt className="text-red-500" />
                      <span className="font-semibold">{new Date(request.slotId.date).toDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <FaClock className="text-red-500" />
                      <span className="font-semibold">{request.slotId.startTime} - {request.slotId.endTime}</span>
                    </div>
                    {!canCancel && (
                      <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium italic">
                        ⚠️ Cutoff passed. Cancellations are restricted within 6 hours of the slot start time.
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-500 dark:text-gray-400 text-xs">
                    <div className="flex items-center gap-2"><MdPhone className="text-gray-400"/> {request.bloodBankId?.phone}</div>
                    <div className="flex items-center gap-2"><MdLocationOn className="text-gray-400"/> {request.bloodBankId?.address?.city}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Donation Appointment?"
        message="Are you sure you want to cancel this booking? This will release the slot and allow other donors to book it."
        confirmText="Yes, Cancel Booking"
      />
    </div>
  );
};

export default MyRequests;