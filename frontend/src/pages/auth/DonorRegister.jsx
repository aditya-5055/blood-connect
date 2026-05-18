import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FaTint } from "react-icons/fa";
import { MdMyLocation } from "react-icons/md";
import { sendDonorOTP, registerDonor } from "../../services/authService";
import { setToken, setUser, setRole } from "../../slices/authSlice";
import { BLOOD_GROUPS } from "../../constants/bloodGroups";
import { ROLES } from "../../constants/roles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const PINCODE_REGEX = /^\d{6}$/;
const OTP_REGEX = /^\d{6}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const DonorRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [coordinates, setCoordinates] = useState([0, 0]);

  const [formData, setFormData] = useState({
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
    if (["city", "state", "pincode"].includes(name)) {
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [name]: name === "pincode" ? value.replace(/\D/g, "").slice(0, 6) : value,
        },
      });
    } else if (["phone", "otp"].includes(name)) {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateDonorForm = () => {
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      toast.error("Full name must be at least 3 characters");
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

    if (!STRONG_PASSWORD_REGEX.test(formData.password)) {
      toast.error("Password must be 8+ chars with upper, lower, number and special character");
      return false;
    }

    if (!formData.bloodGroup) {
      toast.error("Please select blood group");
      return false;
    }

    const age = Number(formData.age);
    if (!Number.isInteger(age) || age < 18 || age > 65) {
      toast.error("Age must be between 18 and 65");
      return false;
    }

    if (!formData.gender) {
      toast.error("Please select gender");
      return false;
    }

    const weight = Number(formData.weight);
    if (!Number.isFinite(weight) || weight < 45) {
      toast.error("Weight must be at least 45 kg");
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
      const response = await sendDonorOTP(formData.email.trim());
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

    if (!validateDonorForm()) {
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await registerDonor({
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        age: Number(formData.age),
        weight: Number(formData.weight),
        otp: formData.otp.trim(),
        address: {
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
        },
        location: {
          type: "Point",
          coordinates,
        },
      });

      if (response.success) {
        // ✅ Auto-login: Store token, user, and role
        dispatch(setToken(response.token));
        dispatch(setUser(response.donor));
        dispatch(setRole(ROLES.DONOR));
        
        toast.success("Registered successfully! Welcome donor 👋");
        
        // ✅ Redirect to donor dashboard directly (not login)
        navigate("/donor/dashboard", { replace: true });
      }
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 409) {
        toast.error("This email is already registered. Please login.");
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4 shadow-lg">
            <FaTint className="text-white text-2xl" />
          </div>
          <h1 className="auth-brand-title">BloodConnect</h1>
          <p className="auth-brand-subtitle">Donor Registration</p>
        </div>

        <div className="auth-card p-8">
          <h2 className="auth-card-title mb-2 text-red-600 dark:text-red-300">Create Your Account 🩸</h2>
          <p className="auth-card-subtitle mb-6">
            Register with valid details to donate safely and see nearby requests.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || otpCooldown > 0}
                    className="px-3 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Strong password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                  placeholder="10-digit number"
                  required
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="18-65"
                  required
                  min={18}
                  max={65}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="45+"
                  min={45}
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

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
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

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

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {submitLoading ? "Registering..." : "Register"}
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

        <div className="text-center mt-4">
          <Link to="/" className="auth-back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonorRegister;
