import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaHospital } from "react-icons/fa";
import { MdMyLocation } from "react-icons/md";
import { sendFacilityOTP, registerFacility } from "../../services/authService";
import { FACILITY_CATEGORIES, FACILITY_TYPES } from "../../constants/bloodGroups";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const PINCODE_REGEX = /^\d{6}$/;
const OTP_REGEX = /^\d{6}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const FACILITY_UI = {
  "": {
    brand: "orange",
    iconBg: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300",
    focusRing: "focus:ring-orange-500",
    titleAccent: "text-orange-600 dark:text-orange-300",
  },
  hospital: {
    brand: "blue",
    iconBg: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300",
    focusRing: "focus:ring-blue-500",
    titleAccent: "text-blue-600 dark:text-blue-300",
  },
  "blood-bank": {
    brand: "red",
    iconBg: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 disabled:bg-red-300",
    focusRing: "focus:ring-red-500",
    titleAccent: "text-red-600 dark:text-red-300",
  },
};

const FacilityRegister = () => {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [coordinates, setCoordinates] = useState([0, 0]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    emergencyContact: "",
    registrationNumber: "",
    facilityType: "",
    facilityCategory: "",
    address: { city: "", state: "", pincode: "" },
    otp: "",
  });

  const selectedTypeUI = FACILITY_UI[formData.facilityType] || FACILITY_UI[""];

  useEffect(() => {
    if (otpCooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "facilityType") {
      setFormData((prev) => ({
        ...prev,
        facilityType: value,
        facilityCategory: value === "blood-bank" ? prev.facilityCategory : "",
      }));
      return;
    }

    if (["city", "state", "pincode"].includes(name)) {
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [name]: name === "pincode" ? value.replace(/\D/g, "").slice(0, 6) : value,
        },
      });
    } else {
      if (["phone", "emergencyContact", "otp"].includes(name)) {
        setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
        return;
      }
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateFacilityForm = () => {
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      toast.error("Facility name must be at least 3 characters");
      return false;
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!PHONE_REGEX.test(formData.phone.trim())) {
      toast.error("Phone number must be 10 digits");
      return false;
    }

    if (!PHONE_REGEX.test(formData.emergencyContact.trim())) {
      toast.error("Emergency contact must be 10 digits");
      return false;
    }

    if (!STRONG_PASSWORD_REGEX.test(formData.password)) {
      toast.error("Password must be 8+ chars with upper, lower, number and special character");
      return false;
    }

    if (!formData.registrationNumber.trim() || formData.registrationNumber.trim().length < 5) {
      toast.error("Registration number is required (min 5 characters)");
      return false;
    }

    if (!formData.facilityType) {
      toast.error("Please select facility type");
      return false;
    }

    if (formData.facilityType === "blood-bank" && !formData.facilityCategory) {
      toast.error("Facility category is required for blood bank");
      return false;
    }

    if (!formData.address.city.trim() || !formData.address.state.trim()) {
      toast.error("City and state are required");
      return false;
    }

    if (!PINCODE_REGEX.test(formData.address.pincode.trim())) {
      toast.error("Pincode must be 6 digits");
      return false;
    }

    if (!otpSent) {
      toast.error("Please send OTP first");
      return false;
    }

    if (!OTP_REGEX.test(formData.otp.trim())) {
      toast.error("Please enter a valid 6-digit OTP");
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (!formData.email.trim()) {
      toast.error("Please enter email first");
      return;
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (otpCooldown > 0 || otpLoading) {
      return;
    }

    setOtpLoading(true);
    try {
      const response = await sendFacilityOTP(formData.email.trim());
      if (response.success) {
        toast.success("OTP sent to your email!");
        setOtpSent(true);
        setOtpCooldown(30);
      }
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 409) {
        toast.error("This email is already registered. Please login instead.");
      } else {
        toast.error(message || "Failed to send OTP");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // ✅ Get GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates([position.coords.longitude, position.coords.latitude]);
        setLocationCaptured(true);
        toast.success("Location captured successfully!");
      },
      () => {
        toast.error("Location access denied. You can update it later from profile.");
        setLocationCaptured(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFacilityForm()) {
      return;
    }
    setSubmitLoading(true);
    try {
      const response = await registerFacility({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        phone: formData.phone.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        otp: formData.otp.trim(),
        address: {
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
        },
        // ✅ Send location
        location: {
          type: "Point",
          coordinates,
        },
      });
      if (response.success) {
        toast.success(
          formData.facilityType === "blood-bank"
            ? "Registration submitted. Visit nearest office within 7 days for verification."
            : "Hospital registration submitted successfully."
        );
        navigate("/facility/login");
      }
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 409) {
        toast.error("Email or registration number already exists");
      } else {
        toast.error(message || "Registration failed");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${selectedTypeUI.iconBg} rounded-full mb-4 shadow-lg`}>
            <FaHospital className="text-white text-2xl" />
          </div>
          <h1 className="auth-brand-title">BloodConnect</h1>
          <p className="auth-brand-subtitle">Facility Registration</p>
        </div>

        {/* Form Card */}
        <div className="auth-card p-8">
          <h2 className={`auth-card-title mb-2 ${selectedTypeUI.titleAccent}`}>
            Register Your Facility 🏥
          </h2>
          <p className="auth-card-subtitle mb-6">
            Register as Hospital or Blood Bank with proper details and secure verification.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Row 1 — Facility Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facility Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter facility name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                    className={`flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || otpCooldown > 0}
                    className={`px-3 py-3 ${selectedTypeUI.button} text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap`}
                  >
                    {otpLoading
                      ? "Sending..."
                      : otpCooldown > 0
                        ? `Resend in ${otpCooldown}s`
                        : otpSent
                          ? "Resend OTP"
                          : "Send OTP"}
                  </button>
                </div>
              </div>
            </div>

            {/* OTP Field */}
            {otpSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter OTP</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6 digit OTP from email"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-green-400 dark:border-green-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-green-100"
                />
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">✅ OTP sent to {formData.email}</p>
              </div>
            )}

            {/* Row 2 — Password + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Use 8+ characters with uppercase, lowercase, number, and symbol.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                />
              </div>
            </div>

            {/* Row 3 — Emergency Contact + Registration Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Emergency contact number"
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="Unique registration number"
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                />
              </div>
            </div>

            {/* Row 4 — Facility Type + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facility Type</label>
                <select
                  name="facilityType"
                  value={formData.facilityType}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                >
                  <option value="">Select Type</option>
                  {FACILITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "hospital" ? "Hospital" : "Blood Bank"}
                    </option>
                  ))}
                </select>
              </div>
              {formData.facilityType === "blood-bank" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facility Category</label>
                <select
                  name="facilityCategory"
                  value={formData.facilityCategory}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="">Select Category</option>
                  {FACILITY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              )}
            </div>

            {/* Row 5 — Address */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                  required
                  className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 ${selectedTypeUI.focusRing} text-sm`}
                />
              </div>
            </div>

            {/* ✅ Get Location Button */}
            <button
              type="button"
              onClick={handleGetLocation}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                locationCaptured
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-400 dark:border-green-500"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              }`}
            >
              <MdMyLocation className="text-lg" />
              {locationCaptured
                ? "✅ Location Captured!"
                : "📍 Get My Location (Required for nearby features)"}
            </button>

            {/* Info Box */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
              <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">⚠️ Important Note</p>
              <p className="text-xs text-orange-600 dark:text-orange-200 mt-1">
                Your registration is under review. Please visit our nearest office within 7 days with your original documents for physical verification. If you do not visit within 7 days, your registration will be automatically rejected.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className={`w-full ${selectedTypeUI.button} text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              {submitLoading ? "Submitting..." : "Submit Registration"}
            </button>

          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-500 font-semibold hover:underline">
                Login here
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you a donor?{" "}
              <Link to="/donor/register" className="text-red-600 font-semibold hover:underline">
                Donor Register
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link to="/" className="auth-back-link">
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FacilityRegister;