import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaBell, FaBellSlash } from "react-icons/fa"; 
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  deleteNotification, 
} from "../../services/notificationService";
import {
  setNotifications,
  setUnreadCount,
  removeNotificationLocally,
  markAllAsReadLocally, // ✅ FIXED: Added missing import
} from "../../slices/notificationSlice";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const data = await getUserNotifications();
        if (data.success) {
          dispatch(setNotifications(data.notifications));
          dispatch(setUnreadCount(data.unreadCount));
        }
      } catch (error) {
        console.error("Could not fetch notifications", error);
      }
    };
    fetchNotifications();
  }, [token, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ PERMANENTLY DELETES FROM DB & UI ON CLICK
  const handleNotificationClick = async (notification) => {
    setIsOpen(false);
    
    if (notification.link) {
      navigate(notification.link);
    }

    // 1. Instant UI update (Optimistic)
    dispatch(removeNotificationLocally(notification._id));

    // 2. Persistent Database update
    try {
      await deleteNotification(notification._id);
    } catch (error) {
      console.error("Failed to delete notification from DB", error);
    }
  };

  const handleMarkAllRead = async () => {
    // 1. Instant UI update
    dispatch(markAllAsReadLocally());
    // 2. Database update
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  // ✅ PERMANENTLY DELETES FROM DB & UI ON 'X'
  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    
    // 1. Instant UI update
    dispatch(removeNotificationLocally(id));
    
    // 2. Persistent Database update
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification from DB", error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!token) return null;

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none"
        aria-label={isOpen ? "Close notifications" : "Open notifications"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <FaBellSlash className="h-6 w-6" />
        ) : (
          <FaBell className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-0 sm:absolute sm:top-auto sm:mt-2 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
          
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] sm:max-h-[450px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">All caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`relative group px-4 py-3 border-b border-gray-50 dark:border-gray-700 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !notif.isRead ? "bg-red-50/40 dark:bg-red-900/20" : "bg-white dark:bg-gray-800"
                  }`}
                >
                  <button
                    onClick={(e) => handleDelete(e, notif._id)}
                    className="absolute top-3 right-3 p-1.5 text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <FaTimes size={10} />
                  </button>

                  <div className="flex justify-between items-start mb-1 pr-4">
                    <h4 className={`text-sm leading-tight ${!notif.isRead ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                      {notif.title}
                    </h4>
                    {!notif.isRead && <span className="h-2 w-2 mt-1 bg-red-500 rounded-full flex-shrink-0 shadow-sm shadow-red-200 dark:shadow-red-900/50"></span>}
                  </div>
                  
                  <p className={`text-xs leading-relaxed ${!notif.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"} line-clamp-2`}>
                    {notif.message}
                  </p>
                  
                  <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                    {formatTime(notif.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-center">
             <span className="text-[10px] text-gray-400 font-medium">End of notifications</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;