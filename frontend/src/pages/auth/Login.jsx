import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaTint, FaHospital, FaUserShield, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail, MdLock } from "react-icons/md";
import { GoogleLogin } from "@react-oauth/google";
import {
  loginDonor,
  loginFacility,
  loginAdmin,
  googleDonorLogin,
  googleFacilityLogin,
} from "../../services/authService";
import { setToken, setUser, setRole } from "../../slices/authSlice";
import { ROLES } from "../../constants/roles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MODE_CONFIG = {
  donor: {
    key: "donor",
    label: "Donor Login",
    icon: FaTint,
    accent: "red",
    formTitle: "Welcome Back, Donor",
    formSubtitle: "Sign in to view nearby requests, donation history, and your dashboard.",
    buttonLabel: "Login as Donor",
    badge: "Give the gift of life",
    heroBullets: [
      "Track your donation history in one place",
      "Respond faster to nearby blood requests",
      "Use Google login for a quicker sign-in",
    ],
  },
  facility: {
    key: "facility",
    label: "Facility Login",
    icon: FaHospital,
    accent: "blue",
    formTitle: "Welcome Back, Facility",
    formSubtitle: "Access blood bank or hospital tools, inventory, and requests.",
    buttonLabel: "Login as Facility",
    badge: "Hospital / Blood Bank",
    heroBullets: [
      "Manage inventory and requests from a secure portal",
      "Continue with Google or email and password",
      "Jump back into your operational dashboard fast",
    ],
  },
  admin: {
    key: "admin",
    label: "Admin Login",
    icon: FaUserShield,
    accent: "purple",
    formTitle: "Administrator Access",
    formSubtitle: "Restricted portal for system administrators only.",
    buttonLabel: "Login as Admin",
    badge: "Restricted Access",
    heroBullets: [
      "Review pending facilities and system reports",
      "Manage approvals and operational oversight",
      "Protected admin-only access path",
    ],
  },
};

const getModeFromPath = (pathname) => {
  if (pathname.includes("/facility/login")) return "facility";
  if (pathname.includes("/admin/login")) return "admin";
  return "donor";
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { token, role } = useSelector((state) => state.auth);

  const [mode, setMode] = useState(getModeFromPath(location.pathname));
  const [donorFormData, setDonorFormData] = useState({ email: "", password: "" });
  const [facilityFormData, setFacilityFormData] = useState({ email: "", password: "" });
  const [adminFormData, setAdminFormData] = useState({ email: "", password: "" });
  const [loadingMode, setLoadingMode] = useState("");
  const [showPassword, setShowPassword] = useState({ donor: false, facility: false, admin: false });
  const [googleBtnWidth, setGoogleBtnWidth] = useState(Math.min(420, Math.max(280, window.innerWidth - 64)));
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains("dark"));

  const modeConfig = MODE_CONFIG[mode];
  const ModeIcon = modeConfig.icon;

  useEffect(() => {
    setMode(getModeFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (!token) return;
    if (role === ROLES.DONOR) navigate("/donor/dashboard", { replace: true });
    else if (role === ROLES.BLOOD_BANK) navigate("/bloodbank/dashboard", { replace: true });
    else if (role === ROLES.HOSPITAL) navigate("/hospital/dashboard", { replace: true });
    else if (role === ROLES.ADMIN) navigate("/admin/dashboard", { replace: true });
  }, [token, role, navigate]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      setGoogleBtnWidth(Math.min(420, Math.max(280, window.innerWidth - 64)));
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const redirectAfterLogin = (accountRole, overrideFrom) => {
    if (overrideFrom) {
      navigate(overrideFrom, { replace: true });
      return;
    }

    if (accountRole === ROLES.DONOR) navigate("/donor/dashboard", { replace: true });
    else if (accountRole === ROLES.BLOOD_BANK) navigate("/bloodbank/dashboard", { replace: true });
    else if (accountRole === ROLES.HOSPITAL) navigate("/hospital/dashboard", { replace: true });
    else if (accountRole === ROLES.ADMIN) navigate("/admin/dashboard", { replace: true });
  };

  const validateLoginForm = (data) => {
    if (!EMAIL_REGEX.test(data.email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!data.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleDonorChange = (e) => {
    setDonorFormData({ ...donorFormData, [e.target.name]: e.target.value });
  };

  const handleFacilityChange = (e) => {
    setFacilityFormData({ ...facilityFormData, [e.target.name]: e.target.value });
  };

  const handleAdminChange = (e) => {
    setAdminFormData({ ...adminFormData, [e.target.name]: e.target.value });
  };

  const handleTabChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === "donor") navigate("/login", { replace: true });
    if (nextMode === "facility") navigate("/facility/login", { replace: true });
    if (nextMode === "admin") navigate("/admin/login", { replace: true });
  };

  const handleDonorSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm(donorFormData)) return;

    setLoadingMode("donor");
    try {
      const response = await loginDonor({
        email: donorFormData.email.trim(),
        password: donorFormData.password,
      });

      if (response.success) {
        dispatch(setToken(response.token));
        dispatch(setUser(response.donor));
        dispatch(setRole(ROLES.DONOR));
        toast.success("Login successful!");
        redirectAfterLogin(ROLES.DONOR, location.state?.from?.pathname);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Invalid email or password.";
      toast.error(message);
    } finally {
      setLoadingMode("");
    }
  };

  const handleFacilitySubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm(facilityFormData)) return;

    setLoadingMode("facility");
    try {
      const response = await loginFacility({
        email: facilityFormData.email.trim(),
        password: facilityFormData.password,
      });

      if (response.success) {
        const accountRole = response.facility.role;
        dispatch(setToken(response.token));
        dispatch(setUser(response.facility));
        dispatch(setRole(accountRole));
        toast.success("Login successful!");
        redirectAfterLogin(accountRole, location.state?.from?.pathname);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      toast.error(message);
    } finally {
      setLoadingMode("");
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm(adminFormData)) return;

    setLoadingMode("admin");
    try {
      const response = await loginAdmin({
        email: adminFormData.email.trim(),
        password: adminFormData.password,
      });

      if (response.success) {
        dispatch(setToken(response.token));
        dispatch(setUser(response.admin));
        dispatch(setRole(ROLES.ADMIN));
        toast.success("Login successful!");
        redirectAfterLogin(ROLES.ADMIN, location.state?.from?.pathname);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      toast.error(message);
    } finally {
      setLoadingMode("");
    }
  };

  const handleDonorGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await googleDonorLogin(credentialResponse.credential);
      if (response.success) {
        dispatch(setToken(response.token));
        dispatch(setUser(response.donor));
        dispatch(setRole(ROLES.DONOR));
        toast.success("Login successful!");
        redirectAfterLogin(ROLES.DONOR, location.state?.from?.pathname);
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Google login failed. Please try again.";
      toast.error(message);
    }
  };

  const handleFacilityGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await googleFacilityLogin(credentialResponse.credential);
      if (response.success) {
        const accountRole = response.facility.role;
        dispatch(setToken(response.token));
        dispatch(setUser(response.facility));
        dispatch(setRole(accountRole));
        toast.success("Login successful!");
        redirectAfterLogin(accountRole, location.state?.from?.pathname);
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Google login failed. Please try again.";
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  const renderPasswordField = (modeKey, data, onChange, focusRing) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Password
      </label>
      <div className="relative">
        <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          type={showPassword[modeKey] ? "text" : "password"}
          name="password"
          value={data.password}
          onChange={onChange}
          placeholder="Enter your password"
          required
          className={`w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => ({ ...prev, [modeKey]: !prev[modeKey] }))}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {showPassword[modeKey] ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      <div className="mt-2 text-right">
        <Link
          to="/forgot-password"
          className={`text-xs font-semibold hover:underline ${
            modeConfig.accent === "blue"
              ? "text-blue-600 dark:text-blue-300"
              : modeConfig.accent === "purple"
                ? "text-purple-600 dark:text-purple-300"
                : "text-red-600 dark:text-red-300"
          }`}
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );

  const renderModeBadge = (text) => {
    const accentClass =
      modeConfig.accent === "blue"
        ? "from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/20 dark:text-blue-300"
        : modeConfig.accent === "purple"
          ? "from-purple-100 to-fuchsia-100 text-purple-700 dark:from-purple-900/30 dark:to-fuchsia-900/20 dark:text-purple-300"
          : "from-red-100 to-rose-100 text-red-700 dark:from-red-900/30 dark:to-rose-900/20 dark:text-red-300";

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${accentClass}`}>
        <span className="w-2 h-2 rounded-full bg-current" />
        {text}
      </span>
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="grid lg:grid-cols-[1.04fr_0.96fr] gap-6 lg:gap-8 items-center">
          {/* Left panel */}
          <div className="order-2 lg:order-1">
            <div className="auth-card auth-login-halo p-6 sm:p-8 lg:p-10">
              <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-red-500/10 blur-3xl" />
              <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                    modeConfig.accent === "blue"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                      : modeConfig.accent === "purple"
                        ? "bg-gradient-to-br from-purple-500 to-fuchsia-500"
                        : "bg-gradient-to-br from-red-500 to-rose-500"
                  }`}>
                    <ModeIcon className="text-white text-3xl" />
                  </div>
                  <div>
                    <h1 className="auth-brand-title">BloodConnect</h1>
                    <p className="auth-brand-subtitle">Secure access for every role</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                    One polished login page for every account.
                  </h2>
                  <p className="mt-4 text-base text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                    Switch between donor, facility, and admin access from a single clean interface.
                    The layout stays consistent, calm, and professional on every device.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {modeConfig.heroBullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-800/70 backdrop-blur px-4 py-4 shadow-sm"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  {renderModeBadge(modeConfig.badge)}
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    Navbar and footer stay visible on this flow
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="order-1 lg:order-2">
            <div className="auth-card p-5 sm:p-7 lg:p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Select login type
                </p>
                <div className="auth-segmented-shell mt-3">
                  {Object.values(MODE_CONFIG).map((item) => {
                    const isActive = mode === item.key;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleTabChange(item.key)}
                        className={`auth-segmented-button ${
                          isActive
                            ? item.accent === "blue"
                              ? "bg-blue-600 text-white shadow-lg"
                              : item.accent === "purple"
                                ? "bg-purple-600 text-white shadow-lg"
                                : "bg-red-600 text-white shadow-lg"
                            : "text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800"
                        }`}
                      >
                        <ItemIcon className="text-base" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="auth-card-title">{modeConfig.formTitle}</h2>
                <p className="auth-card-subtitle mt-2">{modeConfig.formSubtitle}</p>
              </div>

              {mode === "donor" && (
                <>
                  <form onSubmit={handleDonorSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                          type="email"
                          name="email"
                          value={donorFormData.email}
                          onChange={handleDonorChange}
                          placeholder="Enter your email"
                          required
                          className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        />
                      </div>
                    </div>

                    {renderPasswordField("donor", donorFormData, handleDonorChange, "focus:ring-red-500")}

                    <button
                      type="submit"
                      disabled={loadingMode === "donor"}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {loadingMode === "donor" ? "Logging in..." : modeConfig.buttonLabel}
                    </button>
                  </form>

                  <div className="auth-oauth-shell">
                    <p className="auth-oauth-title">or continue with</p>
                    <div className="auth-oauth-google-wrap">
                      <GoogleLogin
                        onSuccess={handleDonorGoogleSuccess}
                        onError={handleGoogleError}
                        width={googleBtnWidth}
                        text="signin_with"
                        shape="rectangular"
                        theme={isDarkMode ? "filled_black" : "outline"}
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === "facility" && (
                <>
                  <form onSubmit={handleFacilitySubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                          type="email"
                          name="email"
                          value={facilityFormData.email}
                          onChange={handleFacilityChange}
                          placeholder="Enter your email"
                          required
                          className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        />
                      </div>
                    </div>

                    {renderPasswordField("facility", facilityFormData, handleFacilityChange, "focus:ring-blue-500")}

                    <button
                      type="submit"
                      disabled={loadingMode === "facility"}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {loadingMode === "facility" ? "Logging in..." : modeConfig.buttonLabel}
                    </button>
                  </form>

                  <div className="auth-oauth-shell">
                    <p className="auth-oauth-title">or continue with</p>
                    <div className="auth-oauth-google-wrap">
                      <GoogleLogin
                        onSuccess={handleFacilityGoogleSuccess}
                        onError={handleGoogleError}
                        width={googleBtnWidth}
                        text="signin_with"
                        shape="rectangular"
                        theme={isDarkMode ? "filled_black" : "outline"}
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === "admin" && (
                <>
                  <div className="mb-5 rounded-2xl border border-purple-100 dark:border-purple-900/50 bg-purple-50/70 dark:bg-purple-900/10 px-4 py-4 shadow-sm">
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium leading-relaxed">
                      Restricted access for system administrators only.
                    </p>
                  </div>

                  <form onSubmit={handleAdminSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                          type="email"
                          name="email"
                          value={adminFormData.email}
                          onChange={handleAdminChange}
                          placeholder="Enter admin email"
                          required
                          className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        />
                      </div>
                    </div>

                    {renderPasswordField("admin", adminFormData, handleAdminChange, "focus:ring-purple-500")}

                    <button
                      type="submit"
                      disabled={loadingMode === "admin"}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {loadingMode === "admin" ? "Logging in..." : modeConfig.buttonLabel}
                    </button>
                  </form>
                </>
              )}

              <div className="mt-6 grid gap-3 text-center sm:text-left sm:grid-cols-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Need an account?{" "}
                  <Link to="/register" className="font-semibold text-red-600 hover:underline">
                    Register here
                  </Link>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 sm:text-right">
                  Need help?{" "}
                  <Link to="/forgot-password" className="font-semibold text-gray-900 dark:text-white hover:underline">
                    Reset password
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
      </div>
    </div>
  );
};

export default Login;
