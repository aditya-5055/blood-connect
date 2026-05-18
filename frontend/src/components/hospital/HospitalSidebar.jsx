import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../slices/authSlice";
import { HOSPITAL_LINKS } from "../../data/sidebar-links";
import { MdLogout } from "react-icons/md";
import ConfirmationModal from "../common/ConfirmationModal";
import Avatar from "../ui/Avatar";

const HospitalSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <>
      <aside className="hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white/95 dark:bg-gray-900/95 border-r border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm flex-col z-40">

        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || "Hospital"}
              </p>
              <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">
                Hospital
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {HOSPITAL_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                }`
              }
            >
              <link.icon className="text-lg flex-shrink-0" />
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <MdLogout className="text-lg flex-shrink-0" />
            Logout
          </button>
        </div>

      </aside>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout from BloodConnect?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};

export default HospitalSidebar;