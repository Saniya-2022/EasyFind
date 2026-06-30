const Notification = require("../models/Notification");
const QRCode = require("../models/QRCode");
const FoundItem = require("../models/FoundItem");

/**
 * Create notification for user
 * @param {ObjectId} userId - User ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 */
async function createNotification(userId, type, title, message, data = {}) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
    });

    await notification.save();
    console.log(`✅ Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create QR ready notification
 * @param {ObjectId} userId - User ID
 * @param {Object} qrCode - QR code document
 * @param {Object} claim - Claim details
 */
async function createQRReadyNotification(userId, qrCode, claim) {
  return createNotification(
    userId,
    "QR_READY",
    "🎉 Your QR Pass is Ready",
    "Your claim has been approved. Your pickup QR Pass is ready.",
    {
      qrId: qrCode._id,
      claimId: claim._id,
      itemCode: claim.code,
      itemName: claim.itemName,
      expiryTime: qrCode.expiryTime,
    }
  );
}

/**
 * Get user's notifications
 * @param {ObjectId} userId - User ID
 * @param {Number} limit - Limit results
 * @param {Number} skip - Skip results
 */
async function getUserNotifications(userId, limit = 50, skip = 0) {
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    return {
      notifications,
      unreadCount,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID
 */
async function markAsRead(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 * @param {ObjectId} userId - User ID
 */
async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    return {
      modified: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @param {ObjectId} userId - User ID
 */
async function getUnreadCount(userId) {
  try {
    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
}

/**
 * Delete notification
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID
 */
async function deleteNotification(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

/**
 * Delete all notifications for user
 * @param {ObjectId} userId - User ID
 */
async function deleteAllNotifications(userId) {
  try {
    const result = await Notification.deleteMany({ userId });
    return {
      deleted: result.deletedCount,
    };
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw error;
  }
}

module.exports = {
  createNotification,
  createQRReadyNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications,
};