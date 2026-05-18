

// import { useState, useEffect } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import { FaTint, FaEye, FaEyeSlash } from "react-icons/fa";
// import { MdEmail, MdLock } from "react-icons/md";
// import { GoogleLogin } from "@react-oauth/google";
// import { loginDonor, googleDonorLogin } from "../../services/authService";
// import { setToken, setUser, setRole } from "../../slices/authSlice";
// import { ROLES } from "../../constants/roles";

// const DonorLogin = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const { token, role } = useSelector((state) => state.auth);

//   const from = location.state?.from?.pathname || "/donor/dashboard";

//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // ✅ Redirect if already logged in
//   useEffect(() => {
//     if (token && role === ROLES.DONOR) {
//       navigate("/donor/dashboard", { replace: true });
//     }
//   }, [token]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const response = await loginDonor(formData);
//       if (response.success) {
//         dispatch(setToken(response.token));
//         dispatch(setUser(response.donor));
//         dispatch(setRole(ROLES.DONOR));
//         toast.success("Login successful!");
//         navigate(from, { replace: true });
//       }
//     } catch (error) {
//       const message =
//         error?.response?.data?.message ||
//         error?.response?.data?.error ||
//         error?.message ||
//         "Invalid email or password.";
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Google Login Handler
//   const handleGoogleSuccess = async (credentialResponse) => {
//     try {
//       const response = await googleDonorLogin(credentialResponse.credential);
//       if (response.success) {
//         dispatch(setToken(response.token));
//         dispatch(setUser(response.donor));
//         dispatch(setRole(ROLES.DONOR));
//         toast.success("Login successful!");
//         navigate(from, { replace: true });
//       }
//     } catch (error) {
//       const message =
//         error?.response?.data?.message ||
//         error?.message ||
//         "Google login failed. Please try again.";
//       toast.error(message);
//     }
//   };

//   const handleGoogleError = () => {
//     toast.error("Google login failed. Please try again.");
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
//       <div className="w-full max-w-md">

//         {/* Logo */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4 shadow-lg">
//             <FaTint className="text-white text-2xl" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">BloodConnect</h1>
//           <p className="text-gray-500 dark:text-gray-400 mt-1">Donor Login</p>
//         </div>

//         {/* Form Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
//           <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
//             Welcome Back! 👋
//           </h2>

//           <form onSubmit={handleSubmit} className="space-y-5">

//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="Enter your email"
//                   required
//                   className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
//                 />
//               </div>
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Password
//               </label>
//               <div className="relative">
//                 <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Enter your password"
//                   required
//                   className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </button>
//               </div>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
//             >
//               {loading ? "Logging in..." : "Login"}
//             </button>

//           </form>

//           {/* Divider */}
//           <div className="flex items-center my-5">
//             <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
//             <span className="px-4 text-sm text-gray-400">or</span>
//             <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
//           </div>

//           {/* Google Login Button */}
//           <div className="flex justify-center">
//             <GoogleLogin
//               onSuccess={handleGoogleSuccess}
//               onError={handleGoogleError}
//               width="368"
//               text="signin_with"
//               shape="rectangular"
//               theme="outline"
//             />
//           </div>

//           {/* Links */}
//           <div className="mt-6 text-center space-y-2">
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Don't have an account?{" "}
//               <Link to="/donor/register" className="text-red-600 font-semibold hover:underline">
//                 Register here
//               </Link>
//             </p>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Are you a facility?{" "}
//               <Link to="/facility/login" className="text-red-600 font-semibold hover:underline">
//                 Facility Login
//               </Link>
//             </p>
//           </div>
//         </div>

//         {/* Back to Home */}
//         <div className="text-center mt-4">
//           <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
//             ← Back to Home
//           </Link>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default DonorLogin;

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaTint, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail, MdLock } from "react-icons/md";
import { GoogleLogin } from "@react-oauth/google";
import { loginDonor, googleDonorLogin } from "../../services/authService";
import { setToken, setUser, setRole } from "../../slices/authSlice";
import { ROLES } from "../../constants/roles";

const DonorLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { token, role } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || "/donor/dashboard";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleBtnWidth, setGoogleBtnWidth] = useState(
    Math.min(368, Math.max(240, window.innerWidth - 72))
  );
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (token && role === ROLES.DONOR) {
      navigate("/donor/dashboard", { replace: true });
    }
  }, [token]);

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
      setGoogleBtnWidth(Math.min(368, Math.max(240, window.innerWidth - 72)));
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginDonor(formData);
      if (response.success) {
        dispatch(setToken(response.token));
        dispatch(setUser(response.donor));
        dispatch(setRole(ROLES.DONOR));
        toast.success("Login successful!");
        navigate(from, { replace: true });
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Invalid email or password.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Login Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await googleDonorLogin(credentialResponse.credential);
      if (response.success) {
        dispatch(setToken(response.token));
        dispatch(setUser(response.donor));
        dispatch(setRole(ROLES.DONOR));
        toast.success("Login successful!");
        navigate(from, { replace: true });
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Google login failed. Please try again.";
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
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
          <p className="auth-brand-subtitle">Donor Login</p>
        </div>

        {/* Form Card */}
        <div className="auth-card p-8">
          <h2 className="auth-card-title mb-6">
            Welcome Back! 👋
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

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
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-red-600 font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Google Login Button */}
          <div className="flex justify-center mt-2">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width={googleBtnWidth}
              text="signin_with"
              shape="rectangular"
              theme={isDarkMode ? "filled_black" : "outline"}
            />
          </div>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{" "}
              <Link to="/register" className="text-red-600 font-semibold hover:underline">
                Register here
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you a facility?{" "}
              <Link to="/facility/login" className="text-red-600 font-semibold hover:underline">
                Facility Login
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

export default DonorLogin;