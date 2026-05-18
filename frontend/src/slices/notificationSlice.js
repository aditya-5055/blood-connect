import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // ✅ Instant removal logic with badge count update
    removeNotificationLocally: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find((n) => n._id === notificationId);
      
      // If the one we are deleting was unread, decrease the badge count
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      
      state.notifications = state.notifications.filter((n) => n._id !== notificationId);
    },
    markAllAsReadLocally: (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  setLoading,
  removeNotificationLocally,
  markAllAsReadLocally,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;