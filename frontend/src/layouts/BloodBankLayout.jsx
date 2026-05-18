// import { Outlet } from "react-router-dom";
// import { NavLink, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { useState } from "react";
// import BloodBankSidebar from "../components/bloodbank/BloodBankSidebar";
// import PublicNavbar from "../components/common/PublicNavbar";
// import ConfirmationModal from "../components/common/ConfirmationModal";
// import { BLOOD_BANK_LINKS } from "../data/sidebar-links";
// import { logout } from "../slices/authSlice";
// import { MdLogout } from "react-icons/md";

// const BloodBankLayout = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [showLogoutModal, setShowLogoutModal] = useState(false);

//   const confirmLogout = () => {
//     dispatch(logout());
//     navigate("/");
//   };

//   const bottomLinks = BLOOD_BANK_LINKS.slice(0, 5);

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       <PublicNavbar />
//       <div className="flex">
//         <BloodBankSidebar />
//         <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 pb-20 md:pb-6">
//           <Outlet />
//         </main>
//       </div>

//       {/* Mobile Bottom Nav */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 px-2 py-2">
//         <div className="flex items-center justify-around">
//           {bottomLinks.map((link) => (
//             <NavLink
//               key={link.path}
//               to={link.path}
//               className={({ isActive }) =>
//                 `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
//                   isActive ? "text-red-600" : "text-gray-400"
//                 }`
//               }
//             >
//               {({ isActive }) => (
//                 <>
//                   <link.icon className={`text-xl ${isActive ? "text-red-600" : "text-gray-400"}`} />
//                   <span className={`text-[10px] font-medium ${isActive ? "text-red-600" : "text-gray-400"}`}>
//                     {link.name.split(" ")[0]}
//                   </span>
//                 </>
//               )}
//             </NavLink>
//           ))}
//           <button
//             onClick={() => setShowLogoutModal(true)}
//             className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-gray-400 hover:text-red-600 transition-all"
//           >
//             <MdLogout className="text-xl" />
//             <span className="text-[10px] font-medium">Logout</span>
//           </button>
//         </div>
//       </div>

//       <ConfirmationModal
//         isOpen={showLogoutModal}
//         title="Logout"
//         message="Are you sure you want to logout from BloodConnect?"
//         onConfirm={confirmLogout}
//         onCancel={() => setShowLogoutModal(false)}
//       />
//     </div>
//   );
// };

// export default BloodBankLayout;
import { Outlet } from "react-router-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import BloodBankSidebar from "../components/bloodbank/BloodBankSidebar";
import PublicNavbar from "../components/common/PublicNavbar";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { BLOOD_BANK_LINKS } from "../data/sidebar-links";
import { logout } from "../slices/authSlice";
import { MdLogout, MdMenu, MdClose } from "react-icons/md";

const BloodBankLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const confirmLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // ✅ First 4 links in bottom nav
  const primaryLinks = BLOOD_BANK_LINKS.slice(0, 4);
  // ✅ Remaining links in "More" menu
  const moreLinks = BLOOD_BANK_LINKS.slice(4);

  return (
    <div className="theme-page bg-gray-50 dark:bg-gray-950">
      <PublicNavbar />
      <div className="flex">
        <BloodBankSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 pb-28 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm z-[1100] px-2 py-2">
        <div className="flex items-center justify-around">

          {/* Primary Links — first 4 */}
          {primaryLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
                  isActive ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={`text-xl ${isActive ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`} />
                  <span className={`text-[10px] font-medium ${isActive ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
                    {link.name.split(" ")[0]}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* ✅ More Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            {showMoreMenu
              ? <MdClose className="text-xl text-red-600 dark:text-red-400" />
              : <MdMenu className="text-xl" />
            }
            <span className={`text-[10px] font-medium ${showMoreMenu ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
              More
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <MdLogout className="text-xl" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>

        </div>
      </div>

      {/* ✅ More Menu Popup */}
      {showMoreMenu && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-700 z-[1110] px-4 py-3 shadow-xl backdrop-blur-sm max-h-[52vh] overflow-y-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase mb-2">More Options</p>
          <div className="space-y-1">
            {moreLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setShowMoreMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-red-600 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                  }`
                }
              >
                <link.icon className="text-lg flex-shrink-0" />
                {link.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout from BloodConnect?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default BloodBankLayout;