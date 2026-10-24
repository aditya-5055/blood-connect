import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaClock, FaCalendarAlt, FaCheckCircle, FaExclamationCircle, FaPlus, FaEdit, FaTrashAlt, FaEye } from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import {
  getDonationRequests,
  getBloodBankSlots,
  createSlot,
  editSlot,
  deleteSlot,
  getSlotBookings,
  completeDonation,
  markNoShow,
} from "../../services/bloodBankService";
import Avatar from "../../components/ui/Avatar";

const DonationRequests = () => {
  const [activeTab, setActiveTab] = useState("bookings"); // "bookings" or "slots"
  const [requests, setRequests] = useState([]); // All bookings
  const [slots, setSlots] = useState([]); // All slots
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modals & Forms
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  
  // Selection States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotBookings, setSlotBookings] = useState([]);
  const [bookingsModalLoading, setBookingsModalLoading] = useState(false);

  // Form Fields
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [units, setUnits] = useState(1);

  // Filters
  const [bookingFilter, setBookingFilter] = useState("all"); // "all", "booked", "completed", "cancelled", "no-show"

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, slotsRes] = await Promise.all([
        getDonationRequests(),
        getBloodBankSlots(),
      ]);
      setRequests(bookingsRes.requests || []);
      setSlots(slotsRes.slots || []);
    } catch (error) {
      toast.error("Failed to load automation data");
    } finally {
      setLoading(false);
    }
  };

  // --- Slot Handlers ---
  const handleOpenCreateSlot = () => {
    setEditingSlot(null);
    setDate("");
    setStartTime("");
    setEndTime("");
    setCapacity(10);
    setIsActive(true);
    setShowSlotModal(true);
  };

  const handleOpenEditSlot = (slot) => {
    setEditingSlot(slot);
    setDate(new Date(slot.date).toISOString().split("T")[0]);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setCapacity(slot.capacity);
    setIsActive(slot.isActive);
    setShowSlotModal(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !capacity) {
      toast.error("All slot fields are required");
      return;
    }

    setActionLoading("slot_save");
    try {
      let res;
      if (editingSlot) {
        res = await editSlot(editingSlot._id, { date, startTime, endTime, capacity, isActive });
        toast.success("Slot updated successfully");
      } else {
        res = await createSlot({ date, startTime, endTime, capacity });
        toast.success("Slot created successfully");
      }
      setShowSlotModal(false);
      const slotsRes = await getBloodBankSlots();
      setSlots(slotsRes.slots || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save slot");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    setActionLoading(slotId + "_delete");
    try {
      const res = await deleteSlot(slotId);
      if (res.success) {
        toast.success("Slot deleted successfully");
        const slotsRes = await getBloodBankSlots();
        setSlots(slotsRes.slots || []);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete slot");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewSlotBookings = async (slot) => {
    setSelectedSlot(slot);
    setSlotBookings([]);
    setShowBookingsModal(true);
    setBookingsModalLoading(true);
    try {
      const res = await getSlotBookings(slot._id);
      setSlotBookings(res.bookings || []);
    } catch (error) {
      toast.error("Failed to load slot bookings");
    } finally {
      setBookingsModalLoading(false);
    }
  };

  // --- Booking Actions ---
  const handleCompleteClick = (booking) => {
    setSelectedBooking(booking);
    setUnits(1);
    setShowCompleteModal(true);
  };

  const handleCompleteConfirm = async () => {
    if (!selectedBooking) return;
    setActionLoading(selectedBooking._id + "_complete");
    try {
      const res = await completeDonation(selectedBooking._id, { units });
      if (res.success) {
        toast.success("Donation completed and added to stock");
        setShowCompleteModal(false);
        setSelectedBooking(null);
        await fetchData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to complete donation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (bookingId) => {
    if (!window.confirm("Mark this donor as No-Show? This will penalize their trust score.")) return;
    setActionLoading(bookingId + "_noshow");
    try {
      const res = await markNoShow(bookingId);
      if (res.success) {
        toast.success("Donor marked as No-Show.");
        await fetchData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = bookingFilter === "all"
    ? requests
    : requests.filter((r) => r.status === bookingFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Donation Appointments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage appointment slots and track donor bookings</p>
        </div>
        {activeTab === "slots" && (
          <button
            onClick={handleOpenCreateSlot}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-red-100 dark:shadow-none"
          >
            <FaPlus size={12} /> Add New Slot
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${activeTab === "bookings" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
        >
          Manage Bookings
        </button>
        <button
          onClick={() => setActiveTab("slots")}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${activeTab === "slots" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
        >
          Manage Slots
        </button>
      </div>

      {/* TAB Content: Bookings */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex gap-2 flex-wrap bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
            {["all", "booked", "completed", "cancelled", "no-show"].map((filter) => (
              <button
                key={filter}
                onClick={() => setBookingFilter(filter)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${bookingFilter === filter ? "bg-red-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <FaRegHospital className="mx-auto text-3xl text-gray-300 dark:text-gray-600 mb-3" />
              <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm">No bookings found for the selected filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map((request) => (
                <div key={request._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <Avatar name={request.donorId?.fullName} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">{request.donorId?.fullName}</h3>
                        <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-bold">
                          Trust: {request.donorId?.trustScore || 100}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {request.bloodGroup} Donor • {request.donorId?.phone}
                      </p>
                      {request.slotId && (
                        <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium">
                          <span className="flex items-center gap-1"><FaCalendarAlt className="text-red-500" /> {new Date(request.slotId.date).toDateString()}</span>
                          <span className="flex items-center gap-1"><FaClock className="text-red-500" /> {request.slotId.startTime} - {request.slotId.endTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                      request.status === "booked" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                      request.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                      request.status === "cancelled" ? "bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}>
                      {request.status}
                    </span>

                    {request.status === "booked" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCompleteClick(request)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleNoShow(request._id)}
                          disabled={actionLoading === request._id + "_noshow"}
                          className="px-3 py-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          No-Show
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB Content: Slots */}
      {activeTab === "slots" && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
          {slots.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="mx-auto text-3xl text-gray-300 dark:text-gray-600 mb-3" />
              <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm">No slots created yet.</p>
              <button
                onClick={handleOpenCreateSlot}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
              >
                Create First Slot
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700 uppercase text-[10px]">
                    <th className="px-6 py-4">Slot Date</th>
                    <th className="px-6 py-4">Time window</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Bookings</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {slots.map((slot) => {
                    const available = slot.capacity - slot.bookedCount;
                    return (
                      <tr key={slot._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all text-gray-700 dark:text-gray-300">
                        <td className="px-6 py-4 font-bold">{new Date(slot.date).toDateString()}</td>
                        <td className="px-6 py-4 font-medium">{slot.startTime} - {slot.endTime}</td>
                        <td className="px-6 py-4">{slot.capacity} seats</td>
                        <td className="px-6 py-4 font-semibold text-red-600 dark:text-red-400">
                          {slot.bookedCount} booked ({available} remaining)
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold uppercase ${slot.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"}`}>
                            {slot.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2.5">
                          <button
                            onClick={() => handleViewSlotBookings(slot)}
                            className="p-2 border border-gray-200 dark:border-gray-700 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-all"
                            title="View Bookings"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            onClick={() => handleOpenEditSlot(slot)}
                            className="p-2 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot._id)}
                            disabled={slot.bookedCount > 0 || actionLoading === slot._id + "_delete"}
                            className="p-2 border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete Slot"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveSlot} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <MdEvent size={26} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {editingSlot ? "Edit Appointment Slot" : "Create Appointment Slot"}
              </h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm text-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm text-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Total Capacity</label>
                <input
                  type="number"
                  min={Math.max(1, editingSlot?.bookedCount || 1)}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm text-gray-800 dark:text-white"
                  required
                />
              </div>

              {editingSlot && (
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300 select-none">
                    Slot is Active (Allow Bookings)
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowSlotModal(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === "slot_save"}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all"
              >
                {actionLoading === "slot_save" ? "Saving..." : "Save Slot"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slot Bookings List Modal */}
      {showBookingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Slot Bookings</h2>
                {selectedSlot && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(selectedSlot.date).toDateString()} • {selectedSlot.startTime} - {selectedSlot.endTime}
                  </p>
                )}
              </div>
              <button onClick={() => setShowBookingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-xl">×</button>
            </div>

            {bookingsModalLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : slotBookings.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No bookings exist for this slot.</p>
            ) : (
              <div className="space-y-3">
                {slotBookings.map((booking) => (
                  <div key={booking._id} className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{booking.donorId?.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{booking.bloodGroup} • {booking.donorId?.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                      booking.status === "booked" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      booking.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                      booking.status === "cancelled" ? "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Donation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <FaCheckCircle className="text-green-600 mx-auto mb-2" size={36} />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Complete Donation</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Confirm visit details for {selectedBooking?.donorId?.fullName}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Blood Units Collected</label>
              <input
                type="number"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-semibold"
                min={1}
                required
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl text-sm">Cancel</button>
              <button
                onClick={handleCompleteConfirm}
                disabled={actionLoading === selectedBooking?._id + "_complete"}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-all"
              >
                {actionLoading === selectedBooking?._id + "_complete" ? "Updating..." : "Complete & Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationRequests;