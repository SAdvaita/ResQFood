import Notification from "../models/notification.model.js";

/**
 * Create a notification (fire-and-forget)
 * @param {{ userId, type, title, body, relatedEntityId, relatedEntityType }} data
 */
export const notify = async (data) => {
  try {
    await Notification.create({
      userId:            data.userId,
      type:              data.type,
      title:             data.title,
      body:              data.body,
      relatedEntityId:   data.relatedEntityId   || null,
      relatedEntityType: data.relatedEntityType || null,
    });
  } catch (err) {
    console.error("[Notification] Failed to create:", err.message);
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, parseInt(query.limit) || 20);
  const filter = { userId };
  if (query.unread === "true") filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { notifications, total, unreadCount, page, pages: Math.ceil(total / limit) };
};

/**
 * Mark notification as read
 */
export const markRead = async (userId, notificationId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  return notif;
};

/**
 * Mark all notifications as read
 */
export const markAllRead = async (userId) => {
  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};
