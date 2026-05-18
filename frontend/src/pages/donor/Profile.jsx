import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  MdEdit, MdSave, MdClose, MdPhone,
  MdLocationOn, MdBloodtype, MdMyLocation
} from "react-icons/md";
import { FaWeight, FaCalendarAlt } from "react-icons/fa";
import { getDonorProfile, updateDonorProfile, toggleAvailability } from "../../services/donorService";
import { setUser } from "../../slices/authSlice";
import Avatar from "../../components/ui/Avatar";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    weight: "",
    address: { city: "", state: "", pincode: "" },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getDonorProfile();
      setProfile(response.donor);
      setFormData({
        fullName: response.donor.fullName || "",
        phone: response.donor.phone || "",
        weight: response.donor.weight || "",
        address: {
          city: response.donor.address?.city || "",
          state: response.donor.address?.state || "",
          pincode: response.donor.address?.pincode || "",
        },
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["city", "state", "pincode"].includes(name)) {
      setFormData({ ...formData, address: { ...formData.address, [name]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await updateDonorProfile({
        ...formData,
        weight: Number(formData.weight),
      });
      if (response.success) {
        toast.success("Profile updated successfully!");
        setEditing(false);
        fetchProfile();
        dispatch(setUser({ ...user, fullName: formData.fullName }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const response = await toggleAvailability();
      if (response.success) {
        toast.success(response.message);
        setProfile({ ...profile, isAvailable: response.isAvailable });
      }
    } catch (error) {
      toast.error("Failed to toggle availability");
    } finally {
      setToggling(false);
    }
  };

  // ✅ Update location
  const handleUpdateLocation = async () => {
    setUpdatingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported by your browser");
        setUpdatingLocation(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await updateDonorProfile({
              location: {
                type: "Point",
                coordinates: [
                  position.coords.longitude,
                  position.coords.latitude,
                ],
              },
            });
            if (response.success) {
              toast.success("Location updated successfully!");
              fetchProfile();
            }
          } catch {
            toast.error("Failed to update location");
          } finally {
            setUpdatingLocation(false);
          }
        },
        () => {
          toast.error("Location access denied. Please allow location access.");
          setUpdatingLocation(false);
        }
      );
    } catch {
      toast.error("Failed to update location");
      setUpdatingLocation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const labelClass = "block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";
  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";
  const viewClass = "text-sm font-medium text-gray-800 dark:text-gray-200 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800";

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 via-white to-rose-50 dark:from-red-900/20 dark:via-gray-800 dark:to-rose-900/20 px-5 py-4 sm:px-6 sm:py-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Manage your personal information, availability, and location preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">

        {/* Avatar + Name + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={profile?.fullName} size="xl" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{profile?.fullName}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full font-semibold border border-red-200 dark:border-red-800/50">
                  {profile?.bloodGroup}
                </span>
                <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${
                  profile?.isAvailable
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                }`}>
                  {profile?.isAvailable ? "Available" : "Unavailable"}
                </span>
                {!profile?.eligibleToDonate && (
                  <span className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full font-semibold border border-yellow-200 dark:border-yellow-800/50">
                    Not Eligible Yet
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit / Save Buttons */}
          <div className="flex gap-2 self-start lg:self-auto">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <MdClose />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  <MdSave />
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
              >
                <MdEdit />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Full Name */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>Full Name</label>
            {editing ? (
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={inputClass}
              />
            ) : (
              <p className={viewClass}>{profile?.fullName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>
              <MdPhone className="inline mr-1" />Phone
            </label>
            {editing ? (
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
              />
            ) : (
              <p className={viewClass}>{profile?.phone}</p>
            )}
          </div>

          {/* Blood Group — Read Only */}
          <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/70 dark:bg-red-900/20 p-3">
            <label className={labelClass}>
              <MdBloodtype className="inline mr-1" />Blood Group
            </label>
            <p className="text-sm font-medium text-red-700 dark:text-red-300 px-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-800/40">
              {profile?.bloodGroup} (cannot be changed)
            </p>
          </div>

          {/* Weight */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>
              <FaWeight className="inline mr-1" />Weight (kg)
            </label>
            {editing ? (
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min={45}
                className={inputClass}
              />
            ) : (
              <p className={viewClass}>
                {profile?.weight ? `${profile.weight} kg` : "Not set"}
              </p>
            )}
          </div>

          {/* Age — Read Only */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>Age</label>
            <p className={viewClass}>
              {profile?.age} years (cannot be changed)
            </p>
          </div>

          {/* Gender — Read Only */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>Gender</label>
            <p className={viewClass}>
              {profile?.gender} (cannot be changed)
            </p>
          </div>

          {/* City */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>
              <MdLocationOn className="inline mr-1" />City
            </label>
            {editing ? (
              <input
                type="text"
                name="city"
                value={formData.address.city}
                onChange={handleChange}
                className={inputClass}
              />
            ) : (
              <p className={viewClass}>{profile?.address?.city}</p>
            )}
          </div>

          {/* State */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>State</label>
            {editing ? (
              <input
                type="text"
                name="state"
                value={formData.address.state}
                onChange={handleChange}
                className={inputClass}
              />
            ) : (
              <p className={viewClass}>{profile?.address?.state}</p>
            )}
          </div>

          {/* Pincode */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>Pincode</label>
            {editing ? (
              <input
                type="text"
                name="pincode"
                value={formData.address.pincode}
                onChange={handleChange}
                className={inputClass}
              />
            ) : (
              <p className={viewClass}>{profile?.address?.pincode}</p>
            )}
          </div>

          {/* Last Donation */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label className={labelClass}>
              <FaCalendarAlt className="inline mr-1" />Last Donation
            </label>
            <p className={viewClass}>
              {profile?.lastDonationDate
                ? new Date(profile.lastDonationDate).toDateString()
                : "Never donated"}
            </p>
          </div>

        </div>
      </div>

      {/* Availability Toggle Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Donation Availability</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {profile?.isAvailable
                ? "You are currently available to donate blood"
                : "You are currently unavailable to donate blood"}
            </p>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={`w-full sm:w-auto px-5 py-2.5 font-semibold text-sm rounded-xl transition-all ${
              profile?.isAvailable
                ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {toggling
              ? "Updating..."
              : profile?.isAvailable
              ? "Set Unavailable"
              : "Set Available"}
          </button>
        </div>
      </div>

      {/* ✅ Location Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">My Location</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Update your location to see nearby blood banks and camps
            </p>
            {profile?.location?.coordinates?.[0] !== 0 ? (
              <p className="text-xs text-green-600 dark:text-green-300 mt-1 font-medium">
                ✅ Location is set
              </p>
            ) : (
              <p className="text-xs text-red-500 dark:text-red-300 mt-1 font-medium">
                ⚠️ Location not set — nearby features may not work
              </p>
            )}
          </div>
          <button
            onClick={handleUpdateLocation}
            disabled={updatingLocation}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm rounded-xl transition-all"
          >
            <MdMyLocation />
            {updatingLocation ? "Updating..." : "Update Location"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Profile;