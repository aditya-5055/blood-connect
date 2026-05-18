import { Link } from "react-router-dom";
import { FaTint } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-10 sm:py-12 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-5 sm:gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <FaTint className="text-red-600 dark:text-red-500 text-lg" />
            </div>
            <span className="font-extrabold tracking-tight text-xl text-gray-900 dark:text-white">BloodConnect</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium text-center">
            © 2026 BloodConnect. Saving lives, one drop at a time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/donor/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">Donor Login</Link>
            <Link to="/facility/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">Facility Login</Link>
            <Link to="/admin/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;