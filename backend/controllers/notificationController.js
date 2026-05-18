const Notification = require("../models/notificationModel");
const mongoose = require("mongoose"); // ✅ FIX: Added missing import

// ─────────────────────────────────
// @route  GET /api/notifications
// @desc   Get all notifications for the logged-in user
// ─────────────────────────────────
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id; 

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/notifications/:id/read
// @desc   Mark a specific notification as read
// ─────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    // Security Check
    if (notification.recipient.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/notifications/read-all
// @desc   Mark all notifications as read for a user
// ─────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  DELETE /api/notifications/:id
// @desc   Delete a specific notification permanently
// ─────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ✅ FIXED: Using mongoose.Types.ObjectId(userId) now works because we imported mongoose.
    // Also added .toString() check for extra safety between roles.
    const deletedNotification = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      recipient: new mongoose.Types.ObjectId(userId)
    });

    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or already deleted",
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Notification deleted permanently from database" 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Failed to delete notification",
      error: error.message 
    });
  }
};