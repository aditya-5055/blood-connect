import { apiConnector } from "./apiConnector";
import { NOTIFICATION_APIS } from "./apis";

// ─────────────────────────────────
// Get all notifications for user
// ─────────────────────────────────
export const getUserNotifications = async () => {
  const response = await apiConnector("GET", NOTIFICATION_APIS.GET_USER_NOTIFICATIONS);
  return response.data;
};

// ─────────────────────────────────
// Mark single notification as read
// ─────────────────────────────────
export const markNotificationAsRead = async (id) => {
  const response = await apiConnector("PUT", NOTIFICATION_APIS.MARK_AS_READ(id));
  return response.data;
};

// ─────────────────────────────────
// Mark all notifications as read
// ─────────────────────────────────
export const markAllNotificationsAsRead = async () => {
  const response = await apiConnector("PUT", NOTIFICATION_APIS.MARK_ALL_AS_READ);
  return response.data;
};

// ─────────────────────────────────
// Delete a notification permanently
// ─────────────────────────────────
export const deleteNotification = async (id) => {
  try {
    // ✅ This now works because NOTIFICATION_APIS.DELETE_NOTIFICATION is a function
    const response = await apiConnector("DELETE", NOTIFICATION_APIS.DELETE_NOTIFICATION(id));
    return response.data;
  } catch (error) {
    console.error("Error in deleteNotification service:", error);
    throw error;
  }
};