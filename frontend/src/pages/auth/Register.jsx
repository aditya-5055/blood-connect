import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FaTint, FaHospital } from "react-icons/fa";
import { MdMyLocation } from "react-icons/md";
import { sendDonorOTP, sendFacilityOTP, registerDonor, registerFacility } from "../../services/authService";
import { setToken, setUser, setRole } from "../../slices/authSlice";
import { BLOOD_GROUPS, FACILITY_CATEGORIES, FACILITY_TYPES } from "../../constants/bloodGroups";
import { ROLES } from "../../constants/roles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const PINCODE_REGEX = /^\d{6}$/;
const OTP_REGEX = /^\d{6}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const FACILITY_UI = {
  "": { brand: "orange", button: "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300" },
  hospital: { brand: "blue", button: "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300" },
  "blood-bank": { brand: "red", button: "bg-red-500 hover:bg-red-600 disabled:bg-red-300" },
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mode, setMode] = useState("donor"); // "donor" or "facility"

  // Donor State
  const [donorOtpSent, setDonorOtpSent] = useState(false);
  const [donorOtpLoading, setDonorOtpLoading] = useState(false);
  const [donorSubmitLoading, setDonorSubmitLoading] = useState(false);
  const [donorOtpCooldown, setDonorOtpCooldown] = useState(0);
  const [donorLocationCaptured, setDonorLocationCaptured] = useState(false);
  const [donorCoordinates, setDonorCoordinates] = useState([0, 0]);

  const [donorFormData, setDonorFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: "",
    age: "",
    gender: "",
    weight: "",
    address: { city: "", state: "", pincode: "" },
    otp: "",
  });

  // Facility State
  const [facilityOtpSent, setFacilityOtpSent] = useState(false);
  const [facilityOtpLoading, setFacilityOtpLoading] = useState(false);
  const [facilitySubmitLoading, setFacilitySubmitLoading] = useState(false);
  const [facilityOtpCooldown, setFacilityOtpCooldown] = useState(0);
  const [facilityLocationCaptured, setFacilityLocationCaptured] = useState(false);
  const [facilityCoordinates, setFacilityCoordinates] = useState([0, 0]);

  const [facilityFormData, setFacilityFormData] = useState({
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

  // Cooldown timers
  useEffect(() => {
    if (donorOtpCooldown <= 0) return;
    const timer = setInterval(() => {
      setDonorOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [donorOtpCooldown]);

  useEffect(() => {
    if (facilityOtpCooldown <= 0) return;
    const timer = setInterval(() => {
      setFacilityOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [facilityOtpCooldown]);

  // ============ DONOR HANDLERS ============
  const handleDonorChange = (e) => {
    const { name, value } = e.target;
    if (["city", "state", "pincode"].includes(name)) {
      setDonorFormData({
        ...donorFormData,
        address: {
          ...donorFormData.address,
          [name]: name === "pincode" ? value.replace(/\D/g, "").slice(0, 6) : value,
        },
      });
    } else {
      setDonorFormData({ ...donorFormData, [name]: value });
    }
  };

  const validateDonorForm = () => {
    if (!donorFormData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!EMAIL_REGEX.test(donorFormData.email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!PHONE_REGEX.test(donorFormData.phone.trim())) {
      toast.error("Phone must be a 10-digit number");
      return false;
    }
    if (!STRONG_PASSWORD_REGEX.test(donorFormData.password)) {
      toast.error("Password must have uppercase, lowercase, number, and symbol (8+ chars)");
      return false;
    }
    if (!donorFormData.bloodGroup) {
      toast.error("Please select a blood group");
      return false;
    }
    if (!donorFormData.age || donorFormData.age < 18 || donorFormData.age > 65) {
      toast.error("Age must be between 18 and 65");
      return false;
    }
    if (!donorFormData.gender) {
      toast.error("Please select a gender");
      return false;
    }
    if (!donorFormData.weight || donorFormData.weight < 45) {
      toast.error("Weight must be at least 45 kg");
      return false;
    }
    if (!donorFormData.address.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!donorFormData.address.state.trim()) {
      toast.error("State is required");
      return false;
    }
    if (!PINCODE_REGEX.test(donorFormData.address.pincode)) {
      toast.error("Pincode must be 6 digits");
      return false;
    }
    if (!donorLocationCaptured) {
      toast.error("Location capture is required");
      return false;
    }
    if (!OTP_REGEX.test(donorFormData.otp.trim())) {
      toast.error("OTP must be 6 digits");
      return false;
    }
    return true;
  };

  const handleDonorSendOTP = async () => {
    if (!EMAIL_REGEX.test(donorFormData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setDonorOtpLoading(true);
    try {
      const response = await sendDonorOTP(donorFormData.email.trim());
      if (response.success) {
        toast.success("OTP sent to your email!");
        setDonorOtpSent(true);
        setDonorOtpCooldown(30);
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
      setDonorOtpLoading(false);
    }
  };

  const handleDonorGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDonorCoordinates([position.coords.longitude, position.coords.latitude]);
        setDonorLocationCaptured(true);
        toast.success("Location captured successfully!");
      },
      () => {
        toast.error("Location access denied. You can update it later from profile.");
        setDonorLocationCaptured(false);
      }
    );
  };

  const handleDonorSubmit = async (e) => {
    e.preventDefault();
    if (!validateDonorForm()) return;

    setDonorSubmitLoading(true);
    try {
      const response = await registerDonor({
        ...donorFormData,
        fullName: donorFormData.fullName.trim(),
        email: donorFormData.email.trim(),
        phone: donorFormData.phone.trim(),
        age: Number(donorFormData.age),
        weight: Number(donorFormData.weight),
        otp: donorFormData.otp.trim(),
        address: {
          city: donorFormData.address.city.trim(),
          state: donorFormData.address.state.trim(),
          pincode: donorFormData.address.pincode.trim(),
        },
        location: { type: "Point", coordinates: donorCoordinates },
      });

      if (response.success) {
        dispatch(setToken(response.token));
        dispatch(setUser(response.donor));
        dispatch(setRole(ROLES.DONOR));
        toast.success("Registered successfully! Welcome donor 👋");
        navigate("/donor/dashboard", { replace: true });
      }
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 409) {
        toast.error("Email already registered. Please login.");
      } else {
        toast.error(message || "Registration failed");
      }
    } finally {
      setDonorSubmitLoading(false);
    }
  };

  // ============ FACILITY HANDLERS ============
  const handleFacilityChange = (e) => {
    const { name, value } = e.target;
    if (name === "facilityType") {
      setFacilityFormData({
        ...facilityFormData,
        facilityType: value,
        facilityCategory: "", // Reset category when type changes
      });
    } else if (["city", "state", "pincode"].includes(name)) {
      setFacilityFormData({
        ...facilityFormData,
        address: {
          ...facilityFormData.address,
          [name]: name === "pincode" ? value.replace(/\D/g, "").slice(0, 6) : value,
        },
      });
    } else if (["phone", "emergencyContact"].includes(name)) {
      // Strip all non-digits and cap at 10 — prevents +91/spaces from breaking the regex
      setFacilityFormData({ ...facilityFormData, [name]: value.replace(/\D/g, "").slice(0, 10) });
    } else {
      setFacilityFormData({ ...facilityFormData, [name]: value });
    }
  };

  const validateFacilityForm = () => {
    if (!facilityFormData.name.trim()) {
      toast.error("Facility name is required");
      return false;
    }
    if (!EMAIL_REGEX.test(facilityFormData.email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!PHONE_REGEX.test(facilityFormData.phone.trim())) {
      toast.error("Phone must be a 10-digit number");
      return false;
    }
    if (!facilityFormData.emergencyContact.trim()) {
      toast.error("Emergency contact is required");
      return false;
    }
    if (!PHONE_REGEX.test(facilityFormData.emergencyContact.trim())) {
      toast.error("Emergency contact must be a 10-digit number");
      return false;
    }
    if (!facilityFormData.registrationNumber.trim()) {
      toast.error("Registration number is required");
      return false;
    }
    if (!facilityFormData.facilityType) {
      toast.error("Please select a facility type");
      return false;
    }
    if (facilityFormData.facilityType === "blood-bank" && !facilityFormData.facilityCategory) {
      toast.error("Please select a category");
      return false;
    }
    if (!STRONG_PASSWORD_REGEX.test(facilityFormData.password)) {
      toast.error("Password must have uppercase, lowercase, number, and symbol (8+ chars)");
      return false;
    }
    if (!facilityFormData.address.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!facilityFormData.address.state.trim()) {
      toast.error("State is required");
      return false;
    }
    if (!PINCODE_REGEX.test(facilityFormData.address.pincode)) {
      toast.error("Pincode must be 6 digits");
      return false;
    }
    if (!facilityLocationCaptured) {
      toast.error("Location capture is required");
      return false;
    }
    if (!OTP_REGEX.test(facilityFormData.otp.trim())) {
      toast.error("OTP must be 6 digits");
      return false;
    }
    return true;
  };

  const handleFacilitySendOTP = async () => {
    if (!EMAIL_REGEX.test(facilityFormData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setFacilityOtpLoading(true);
    try {
      const response = await sendFacilityOTP(facilityFormData.email.trim());
      if (response.success) {
        toast.success("OTP sent to your email!");
        setFacilityOtpSent(true);
        setFacilityOtpCooldown(30);
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
      setFacilityOtpLoading(false);
    }
  };

  const handleFacilityGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFacilityCoordinates([position.coords.longitude, position.coords.latitude]);
        setFacilityLocationCaptured(true);
        toast.success("Location captured successfully!");
      },
      () => {
        toast.error("Location access denied. You can update it later from profile.");
        setFacilityLocationCaptured(false);
      }
    );
  };

  const handleFacilitySubmit = async (e) => {
    e.preventDefault();
    if (!validateFacilityForm()) return;

    setFacilitySubmitLoading(true);
    try {
      const response = await registerFacility({
        ...facilityFormData,
        name: facilityFormData.name.trim(),
        email: facilityFormData.email.trim(),
        phone: facilityFormData.phone.trim(),
        emergencyContact: facilityFormData.emergencyContact.trim(),
        registrationNumber: facilityFormData.registrationNumber.trim(),
        otp: facilityFormData.otp.trim(),
        address: {
          city: facilityFormData.address.city.trim(),
          state: facilityFormData.address.state.trim(),
          pincode: facilityFormData.address.pincode.trim(),
        },
        location: { type: "Point", coordinates: facilityCoordinates },
      });

      if (response.success) {
        toast.success(
          facilityFormData.facilityType === "blood-bank"
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
      setFacilitySubmitLoading(false);
    }
  };

  const uiConfig = FACILITY_UI[facilityFormData.facilityType] || FACILITY_UI[""];

  return (
    <div className="auth-page">
      <div className="auth-shell px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200/80 dark:border-red-800/60 bg-white/80 dark:bg-gray-900/70 px-4 py-1.5 shadow-sm mb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-200">
              Donor and Facility registration in one place
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Choose the registration type below. Donor registration starts by default, and facility registration is available with a single tap.
          </p>
        </div>

        <div className="auth-card-wrapper">
          {/* Toggle Button */}
          <div className="max-w-md mx-auto mb-6 sm:mb-8">
            <div className="grid grid-cols-2 rounded-full border border-gray-200/80 dark:border-gray-700/80 bg-white/85 dark:bg-gray-900/60 p-1.5 shadow-sm backdrop-blur-sm gap-1.5">
              <button
                onClick={() => setMode("donor")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-semibold transition-all duration-200 ${
                  mode === "donor"
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <FaTint className="text-base" />
                <span>Donor</span>
              </button>
              <button
                onClick={() => setMode("facility")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-semibold transition-all duration-200 ${
                  mode === "facility"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <FaHospital className="text-base" />
                <span>Facility</span>
              </button>
            </div>
          </div>

        {/* DONOR FORM */}
        {mode === "donor" && (
          <div className="auth-card w-full max-w-5xl mx-auto p-6 sm:p-8 lg:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl flex items-center justify-center ring-1 ring-red-200/70 dark:ring-red-800/60">
                  <FaTint className="text-3xl text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Join as a Donor</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-[15px]">
                Save lives by donating blood regularly
              </p>
            </div>

            <form onSubmit={handleDonorSubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={donorFormData.fullName}
                    onChange={handleDonorChange}
                    placeholder="Enter full name"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      name="email"
                      value={donorFormData.email}
                      onChange={handleDonorChange}
                      placeholder="Enter email"
                      required
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleDonorSendOTP}
                      disabled={donorOtpLoading || donorOtpCooldown > 0}
                      className="px-3 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap"
                    >
                      {donorOtpLoading
                        ? "Sending..."
                        : donorOtpCooldown > 0
                          ? `Resend in ${donorOtpCooldown}s`
                          : donorOtpSent
                            ? "Resend OTP"
                            : "Send OTP"}
                    </button>
                  </div>
                </div>
              </div>

              {/* OTP Field */}
              {donorOtpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={donorFormData.otp}
                    onChange={handleDonorChange}
                    placeholder="Enter 6 digit OTP from email"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-green-400 dark:border-green-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-green-100"
                  />
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">✅ OTP sent to {donorFormData.email}</p>
                </div>
              )}

              {/* Password & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={donorFormData.password}
                    onChange={handleDonorChange}
                    placeholder="Strong password"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    8+ chars with uppercase, lowercase, number, symbol
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={donorFormData.phone}
                    onChange={handleDonorChange}
                    placeholder="10-digit number"
                    required
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Blood Group, Age, Gender, Weight */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={donorFormData.bloodGroup}
                    onChange={handleDonorChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={donorFormData.age}
                    onChange={handleDonorChange}
                    placeholder="18-65"
                    min="18"
                    max="65"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={donorFormData.gender}
                    onChange={handleDonorChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={donorFormData.weight}
                    onChange={handleDonorChange}
                    placeholder="Minimum 45kg"
                    min="45"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={donorFormData.address.city}
                    onChange={handleDonorChange}
                    placeholder="City"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={donorFormData.address.state}
                    onChange={handleDonorChange}
                    placeholder="State"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={donorFormData.address.pincode}
                    onChange={handleDonorChange}
                    placeholder="6-digit pincode"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Location Button */}
              <button
                type="button"
                onClick={handleDonorGetLocation}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                  donorLocationCaptured
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-400 dark:border-green-500"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                }`}
              >
                <MdMyLocation className="text-lg" />
                {donorLocationCaptured
                  ? "✅ Location Captured!"
                  : "📍 Get My Location (Required for nearby features)"}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={donorSubmitLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {donorSubmitLoading ? "Registering..." : "Register as Donor"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Already have an account?{" "}
                <Link to="/login" className="text-red-600 font-semibold hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* FACILITY FORM */}
        {mode === "facility" && (
          <div className="auth-card w-full max-w-5xl mx-auto p-6 sm:p-8 lg:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center ring-1 ring-blue-200/70 dark:ring-blue-800/60">
                  <FaHospital className="text-3xl text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Register Your Facility</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-[15px]">
                Join our network and manage blood inventory
              </p>
            </div>

            <form onSubmit={handleFacilitySubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Facility Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={facilityFormData.name}
                    onChange={handleFacilityChange}
                    placeholder="Hospital/Blood Bank name"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      name="email"
                      value={facilityFormData.email}
                      onChange={handleFacilityChange}
                      placeholder="Enter email"
                      required
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleFacilitySendOTP}
                      disabled={facilityOtpLoading || facilityOtpCooldown > 0}
                      className="px-3 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap"
                    >
                      {facilityOtpLoading
                        ? "Sending..."
                        : facilityOtpCooldown > 0
                          ? `Resend in ${facilityOtpCooldown}s`
                          : facilityOtpSent
                            ? "Resend OTP"
                            : "Send OTP"}
                    </button>
                  </div>
                </div>
              </div>

              {/* OTP Field */}
              {facilityOtpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={facilityFormData.otp}
                    onChange={handleFacilityChange}
                    placeholder="Enter 6 digit OTP from email"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-green-400 dark:border-green-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-green-100"
                  />
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">✅ OTP sent to {facilityFormData.email}</p>
                </div>
              )}

              {/* Facility Type & Registration Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Facility Type
                  </label>
                  <select
                    name="facilityType"
                    value={facilityFormData.facilityType}
                    onChange={handleFacilityChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Type</option>
                    {FACILITY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={facilityFormData.registrationNumber}
                    onChange={handleFacilityChange}
                    placeholder="Unique registration ID"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Category (conditional) */}
              {facilityFormData.facilityType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="facilityCategory"
                    value={facilityFormData.facilityCategory}
                    onChange={handleFacilityChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {FACILITY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Password & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={facilityFormData.password}
                    onChange={handleFacilityChange}
                    placeholder="Strong password"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    8+ chars with uppercase, lowercase, number, symbol
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={facilityFormData.phone}
                    onChange={handleFacilityChange}
                    placeholder="10-digit number"
                    required
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={facilityFormData.emergencyContact}
                  onChange={handleFacilityChange}
                  placeholder="10-digit emergency contact number"
                  required
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={facilityFormData.address.city}
                    onChange={handleFacilityChange}
                    placeholder="City"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={facilityFormData.address.state}
                    onChange={handleFacilityChange}
                    placeholder="State"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={facilityFormData.address.pincode}
                    onChange={handleFacilityChange}
                    placeholder="6-digit pincode"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Location Button */}
              <button
                type="button"
                onClick={handleFacilityGetLocation}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                  facilityLocationCaptured
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-400 dark:border-green-500"
                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                }`}
              >
                <MdMyLocation className="text-lg" />
                {facilityLocationCaptured
                  ? "✅ Location Captured!"
                  : "📍 Get My Location (Required for nearby features)"}
              </button>

              {/* Important Note */}
              {facilityFormData.facilityType === "blood-bank" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
                    ⏰ Important: Your registration will be verified within 7 days. Approval is required before admin creates your account.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={facilitySubmitLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {facilitySubmitLoading ? "Registering..." : "Register Facility"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        )}

          <div className="text-center mt-5 sm:mt-6">
            <Link to="/" className="auth-back-link">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
