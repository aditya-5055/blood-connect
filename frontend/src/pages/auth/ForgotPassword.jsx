import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaTint } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { resetPasswordToken } from "../../services/authService";

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD PAGE
// Step 1 — User enters their email + account type
// We send them a reset link to their email
//
// Route: /forgot-password
// Add this route in your App.jsx:
//   <Route path="/forgot-password" element={<ForgotPassword />} />
// ─────────────────────────────────────────────────────────

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);

  // ✅ Track if email was successfully sent
  // When true → show success message instead of form
  const [emailSent, setEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    userType: "donor", // default to donor
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await resetPasswordToken(formData.email, formData.userType);
      if (response.success) {
        setEmailSent(true);
        toast.success("Reset link sent! Please check your email.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send reset link. Please try again.");
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
          <p className="auth-brand-subtitle">Forgot Password</p>
        </div>

        <div className="auth-card p-8">

          {/* ─────────────────────────────────
              SHOW THIS when email has NOT been sent yet
              ───────────────────────────────── */}
          {!emailSent ? (
            <>
              <h2 className="auth-card-title mb-2">
                Forgot your password? 🔐
              </h2>
              <p className="auth-card-subtitle mb-6">
                Enter your registered email address. We will send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Account Type — Donor or Facility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    I am a
                  </label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    <option value="donor">Donor</option>
                    <option value="facility">Hospital / Blood Bank</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your registered email"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

              </form>
            </>
          ) : (
            /* ─────────────────────────────────
               SHOW THIS after email is sent
               Success message — same style as your info boxes
               ───────────────────────────────── */
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="auth-card-title mb-3">
                Check your email!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                We sent a password reset link to
              </p>
              <p className="text-base font-semibold text-red-600 mb-6">
                {formData.email}
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-left mb-6">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">📌 What to do next:</p>
                <ul className="text-xs text-red-600 dark:text-red-200 mt-2 space-y-1 list-disc list-inside">
                  <li>Open the email we just sent you</li>
                  <li>Click the <strong>Reset My Password</strong> button in the email</li>
                  <li>Enter your new password on the next page</li>
                  <li>The link expires in <strong>1 hour</strong></li>
                </ul>
              </div>

              {/* Resend option */}
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Did not receive the email?{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          )}

          {/* Links — always visible */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Remembered your password?{" "}
              <Link to="/login" className="text-red-600 font-semibold hover:underline">
                Login here
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

export default ForgotPassword;