import { useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaTint, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdLock } from "react-icons/md";
import { resetPassword } from "../../services/authService";

// ─────────────────────────────────────────────────────────
// UPDATE PASSWORD PAGE
// Step 2 — User clicked the link in their email
// They arrive here at: /update-password/:token?userType=donor
// They enter new password + confirm password
// We call the API with token + userType from URL
//
// Route: /update-password/:token
// Add this route in your App.jsx:
//   <Route path="/update-password/:token" element={<UpdatePassword />} />
// ─────────────────────────────────────────────────────────

const UpdatePassword = () => {
  const navigate = useNavigate();

  // ✅ Get token from URL params — /update-password/:token
  const { token } = useParams();

  // ✅ Get userType from query string — ?userType=donor or ?userType=facility
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("userType") || "donor";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Track if password was successfully reset
  // When true → show success message
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Client side check — same as your old project
    if (formData.password !== formData.confirmPassword) {
      toast.error("Password and confirm password do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(
        formData.password,
        formData.confirmPassword,
        token,
        userType
      );

      if (response.success) {
        setPasswordUpdated(true);
        toast.success("Password reset successful!");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        "Failed to reset password. The link may have expired. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4 shadow-lg">
            <FaTint className="text-white text-2xl" />
          </div>
          <h1 className="auth-brand-title">BloodConnect</h1>
          <p className="auth-brand-subtitle">Reset Password</p>
        </div>

        <div className="auth-card p-8">

          {/* ─────────────────────────────────
              SHOW THIS when password has NOT been updated yet
              ───────────────────────────────── */}
          {!passwordUpdated ? (
            <>
              <h2 className="auth-card-title mb-2">
                Set a new password 🔒
              </h2>
              <p className="auth-card-subtitle mb-6">
                Your new password must be at least 6 characters.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      required
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter new password"
                      required
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {/* ✅ Live match indicator — shows green/red as user types */}
                  {formData.confirmPassword && (
                    <p className={`text-xs mt-1 ${
                      formData.password === formData.confirmPassword
                        ? "text-green-600"
                        : "text-red-500"
                    }`}>
                      {formData.password === formData.confirmPassword
                        ? "✅ Passwords match"
                        : "❌ Passwords do not match"}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

              </form>
            </>
          ) : (
            /* ─────────────────────────────────
               SHOW THIS after password is reset successfully
               ───────────────────────────────── */
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="auth-card-title mb-3">
                Password reset successful!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Your password has been updated. You can now login with your new password.
              </p>

              {/* ✅ Redirect to correct login page based on userType */}
              <Link
                to={userType === "facility" ? "/facility/login" : "/donor/login"}
                className="w-full inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center"
              >
                Go to Login
              </Link>
            </div>
          )}

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

export default UpdatePassword;