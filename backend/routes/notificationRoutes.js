const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// Import the auth middleware
const { auth } = require("../middleware/authMiddleware");

// Protect all notification routes with the auth middleware
// This ensures req.user is populated for both Donors and Facilities
router.use(auth);

// ─────────────────────────────────
// Notification Routes
// ─────────────────────────────────

// GET /api/notifications - Get all notifications for logged-in user
router.get("/", getUserNotifications);

// PUT /api/notifications/read-all - Mark all as read
router.put("/read-all", markAllAsRead);

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put("/:id/read", markAsRead);

// DELETE /api/notifications/:id - Permanent deletion from DB
router.delete("/:id", deleteNotification);

module.exports = router;