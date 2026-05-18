const Notification = require("../models/notificationModel");

/**
 * Reusable utility to send in-app notifications
 * @param {ObjectId} recipientId - The ID of the user receiving the notification
 * @param {String} recipientModel - "Donor", "Facility", or "Admin"
 * @param {String} title - Notification title
 * @param {String} message - Notification body
 * @param {String} link - (Optional) URL to redirect to when clicked
 * @param {Object} meta - (Optional) additional fields like relatedRequest
 */
const sendNotification = async (
  recipientId,
  recipientModel,
  title,
  message,
  link = "",
  meta = {}
) => {
  try {
    await Notification.create({
      recipient: recipientId,
      recipientModel,
      title,
      message,
      link,
      ...(meta || {}),
    });
  } catch (error) {
    // We log the error, but we DO NOT throw it. 
    // If a notification fails, it shouldn't crash the main process (like saving a blood request).
    console.error("Failed to create in-app notification:", error.message);
  }
};

module.exports = sendNotification;