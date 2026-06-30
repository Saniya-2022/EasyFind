const express = require("express");
const router = express.Router();
router.use(express.json());
const Notification = require("../models/Notification");
const { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification, deleteAllNotifications } = require("../utils/notificationService");
const auth = require("../middlewares/user-auth");

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private (User)
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { limit = 50, skip = 0 } = req.query;

    const result = await getUserNotifications(userId, parseInt(limit), parseInt(skip));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private (User)
 */
router.get("/unread-count", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const count = await getUnreadCount(userId);

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (User)
 */
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const notification = await markAsRead(req.params.id, userId);

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (User)
 */
router.patch("/read-all", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const result = await markAllAsRead(userId);

    res.status(200).json({
      message: "All notifications marked as read",
      ...result,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private (User)
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const notification = await deleteNotification(req.params.id, userId);

    res.status(200).json({
      message: "Notification deleted successfully",
      notification,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      message: "Failed to delete notification",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private (User)
 */
router.delete("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const result = await deleteAllNotifications(userId);

    res.status(200).json({
      message: "All notifications deleted successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      message: "Failed to delete all notifications",
      error: error.message,
    });
  }
});

module.exports = router;