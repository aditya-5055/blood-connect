import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaMapMarkerAlt, FaClock, FaUsers } from "react-icons/fa";
import { MdCampaign, MdAdd, MdCalendarToday, MdCheck, MdClose } from "react-icons/md";
import {
  getMyCamps,
  createCamp,
  getCampDonors,
  markAttendance,
  completeCamp,
  updateCampStatus,
} from "../../services/bloodBankService";
import { BLOOD_GROUPS } from "../../constants/bloodGroups";

const STATUS_META = {
  all: {
    label: "All",
    chip: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  },
  upcoming: {
    label: "Upcoming",
    chip: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  },
  ongoing: {
    label: "Ongoing",
    chip: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  },
  completed: {
    label: "Completed",
    chip: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  },
  cancelled: {
    label: "Cancelled",
    chip: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  },
};

const Camps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonorsModal, setShowDonorsModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [campDonors, setCampDonors] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campDate: "",
    startTime: "",
    endTime: "",
    capacity: "",
    address: { street: "", city: "", state: "", pincode: "" },
    location: { type: "Point", coordinates: [0, 0] },
  });

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      const response = await getMyCamps();
      setCamps(response.camps || []);
    } catch (error) {
      toast.error("Failed to load camps");
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          location: {
            type: "Point",
            coordinates: [position.coords.longitude, position.coords.latitude],
          },
        });
        toast.success("Camp location captured!");
      },
      () => toast.error("Location access denied")
    );
  };

  const handleCreateCamp = async () => {
    if (!formData.name || !formData.campDate || !formData.startTime ||
      !formData.endTime || !formData.capacity ||
      !formData.address.city || !formData.address.state ||
      !formData.address.street || !formData.address.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const response = await createCamp({
        ...formData,
        capacity: Number(formData.capacity),
      });
      if (response.success) {
        toast.success("Camp created successfully!");
        setShowCreateModal(false);
        fetchCamps();
        setFormData({
          name: "",
          description: "",
          campDate: "",
          startTime: "",
          endTime: "",
          capacity: "",
          address: { street: "", city: "", state: "", pincode: "" },
          location: { type: "Point", coordinates: [0, 0] },
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create camp");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDonors = async (camp) => {
    setSelectedCamp(camp);
    try {
      const response = await getCampDonors(camp._id);
      setCampDonors(response);
      setShowDonorsModal(true);
    } catch (error) {
      toast.error("Failed to load donors");
    }
  };

  const handleMarkAttendance = async (campId, donorId, bloodGroup) => {
    setActionLoading(donorId);
    try {
      const response = await markAttendance(campId, donorId, { bloodGroup });
      if (response.success) {
        toast.success("Attendance marked!");
        // Refresh donors
        const updated = await getCampDonors(campId);
        setCampDonors(updated);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to mark attendance");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteCamp = async (campId) => {
    setActionLoading(campId + "_complete");
    try {
      const response = await completeCamp(campId);
      if (response.success) {
        toast.success(`Camp completed! ${response.summary.totalDonated} donors, ${response.summary.totalUnitsCollected} units collected.`);
        setShowDonorsModal(false);
        fetchCamps();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to complete camp");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelCamp = async (campId) => {
    setActionLoading(campId + "_cancel");
    try {
      const response = await updateCampStatus(campId, { status: "cancelled" });
      if (response.success) {
        toast.success("Camp cancelled");
        fetchCamps();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel camp");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    return STATUS_META[status]?.chip || STATUS_META.all.chip;
  };

  const filtered = filter === "all"
    ? camps
    : camps.filter((c) => c.status === filter);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Donation Camps</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your blood donation camps</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <MdAdd />
          Create Camp
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["upcoming", "ongoing", "completed", "cancelled"].map((s) => (
          <div
            key={s}
            onClick={() => setFilter(s)}
            className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 text-center cursor-pointer transition-all hover:shadow-md ${
              filter === s ? "ring-2 ring-red-500/80" : ""
            }`}
          >
            <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {camps.filter((c) => c.status === s).length}
            </p>
            <p className="text-xs font-medium capitalize mt-0.5 text-gray-600 dark:text-gray-300">
              {STATUS_META[s].label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-gray-100 dark:bg-gray-800/80 p-2 rounded-2xl">
        {["all", "upcoming", "ongoing", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f
                ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-300 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-300"
            }`}
          >
            {STATUS_META[f].label} ({f === "all" ? camps.length : camps.filter(c => c.status === f).length})
          </button>
        ))}
      </div>

      {/* Camp List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <MdCampaign className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No camps found</h3>
          <p className="text-gray-400 text-sm mt-1">Create a camp to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all"
          >
            Create Camp
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((camp) => (
            <div key={camp._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all">

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MdCampaign className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{camp.name}</h3>
                    {camp.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{camp.description}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${getStatusColor(camp.status)}`}>
                  {STATUS_META[camp.status]?.label || camp.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MdCalendarToday className="text-gray-400 flex-shrink-0" />
                  {new Date(camp.campDate).toDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FaClock className="text-gray-400 flex-shrink-0 text-xs" />
                  {camp.startTime} - {camp.endTime}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 text-xs" />
                  {camp.address?.city}, {camp.address?.state}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FaUsers className="text-gray-400 flex-shrink-0 text-xs" />
                  {camp.availableSeats} seats available / {camp.capacity} total
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <button
                  onClick={() => handleViewDonors(camp)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  View Donors
                </button>
                {(camp.status === "upcoming" || camp.status === "ongoing") && (
                  <button
                    onClick={() => handleCancelCamp(camp._id)}
                    disabled={actionLoading === camp._id + "_cancel"}
                    className="px-3 py-2 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-semibold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
                {camp.status === "ongoing" && (
                  <button
                    onClick={() => handleCompleteCamp(camp._id)}
                    disabled={actionLoading === camp._id + "_complete"}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    {actionLoading === camp._id + "_complete" ? "..." : "Complete"}
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── Create Camp Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full max-w-lg my-4 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Create Donation Camp</h2>

            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Camp Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter camp name"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                />
              </div>

              {/* Date + Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Camp Date *</label>
                  <input
                    type="date"
                    value={formData.campDate}
                    onChange={(e) => setFormData({ ...formData, campDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Max donors"
                    min={1}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street *</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  placeholder="Street address"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    placeholder="City"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                    placeholder="State"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                    placeholder="Pincode"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Location */}
              <button
                type="button"
                onClick={handleGetLocation}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  formData.location.coordinates[0] !== 0
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-400 dark:border-green-700"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                }`}
              >
                {formData.location.coordinates[0] !== 0
                  ? "✅ Camp Location Captured!"
                  : "📍 Get Camp Location"}
              </button>

            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCamp}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold text-sm rounded-xl"
              >
                {submitting ? "Creating..." : "Create Camp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Camp Donors Modal ── */}
      {showDonorsModal && campDonors && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full max-w-3xl my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">Camp Donors</p>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                  {campDonors.camp?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Donor registrations and donation status overview
                </p>
              </div>
              <button
                onClick={() => setShowDonorsModal(false)}
                className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Registered</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{campDonors.summary?.totalRegistered || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-300">Donated</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{campDonors.summary?.donated || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-900 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-300">Pending</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{campDonors.summary?.pending || 0}</p>
              </div>
            </div>

            {/* Donor List */}
            <div className="space-y-4 max-h-[56vh] overflow-y-auto pr-1">
              {/* Registered Donors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Registered Donors</p>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                    {campDonors.donors?.registered?.length || 0}
                  </span>
                </div>
              {campDonors.donors?.registered?.map((d) => (
                <div key={d._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{d.donorId?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{d.donorId?.phone} | {d.donorId?.bloodGroup}</p>
                  </div>
                  {selectedCamp?.status === "ongoing" && (
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <select
                        id={`bg_${d._id}`}
                        className="px-2 py-1.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-xs focus:outline-none"
                        defaultValue={d.donorId?.bloodGroup}
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const bg = document.getElementById(`bg_${d._id}`).value;
                          handleMarkAttendance(selectedCamp._id, d.donorId._id, bg);
                        }}
                        disabled={actionLoading === d.donorId._id}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg"
                      >
                        {actionLoading === d.donorId._id ? "..." : "Mark Donated"}
                      </button>
                    </div>
                  )}
                  {selectedCamp?.status !== "ongoing" && (
                    <span className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full font-semibold self-start sm:self-auto">
                      Registered
                    </span>
                  )}
                </div>
              ))}
              {(campDonors.donors?.registered?.length || 0) === 0 && (
                <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
                  No registered donors yet.
                </div>
              )}
              </div>

              {/* Donated */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Donated</p>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">
                    {campDonors.donors?.donated?.length || 0}
                  </span>
                </div>
              {campDonors.donors?.donated?.map((d) => (
                <div key={d._id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{d.donorId?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{d.bloodGroup} • {d.units} unit</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                    ✅ Donated
                  </span>
                </div>
              ))}
              {(campDonors.donors?.donated?.length || 0) === 0 && (
                <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
                  No donations recorded yet.
                </div>
              )}
              </div>

              {/* No Show */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No Show</p>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold">
                    {campDonors.donors?.noShow?.length || 0}
                  </span>
                </div>
              {campDonors.donors?.noShow?.map((d) => (
                <div key={d._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{d.donorId?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{d.donorId?.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full font-medium">
                    No Show
                  </span>
                </div>
              ))}
              {(campDonors.donors?.noShow?.length || 0) === 0 && (
                <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
                  No no-show donors.
                </div>
              )}
              </div>
            </div>

            {/* Complete Camp Button */}
            {selectedCamp?.status === "ongoing" && (
              <button
                onClick={() => handleCompleteCamp(selectedCamp._id)}
                disabled={actionLoading === selectedCamp._id + "_complete"}
                className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold text-sm rounded-xl transition-all"
              >
                {actionLoading === selectedCamp._id + "_complete"
                  ? "Completing..."
                  : "✅ Complete Camp — Add Blood to Inventory"}
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Camps;