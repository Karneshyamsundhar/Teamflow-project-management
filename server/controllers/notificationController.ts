import { Response } from "express";
import { prisma } from "../db/prisma.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { NotificationType } from "@prisma/client";

const NOTIF_FROM_PRISMA = {
  [NotificationType.TASK_ASSIGNED]: "Task Assigned",
  [NotificationType.TASK_COMPLETED]: "Task Completed",
  [NotificationType.PROJECT_UPDATED]: "Project Updated",
  [NotificationType.INCIDENT_ASSIGNED]: "Incident Assigned"
} as const;

function toClientNotifType(type: NotificationType): "Task Assigned" | "Task Completed" | "Project Updated" | "Incident Assigned" {
  return (NOTIF_FROM_PRISMA[type] || "Project Updated") as any;
}

export class NotificationController {
  // Get notifications for logged in user
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const myUserId = req.user.id;

      // Fetch from MySQL
      const list = await prisma.notification.findMany({
        where: { userId: myUserId },
        orderBy: { createdAt: "desc" }
      });

      const unreadCount = await prisma.notification.count({
        where: {
          userId: myUserId,
          isRead: false
        }
      });

      const formattedNotifications = list.map(n => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        type: toClientNotifType(n.type),
        createdAt: n.createdAt.toISOString()
      }));

      return res.json({
        notifications: formattedNotifications,
        unreadCount
      });
    } catch (error: any) {
      console.error("Retrieve notifications failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve notifications." });
    }
  }

  // Mark notification as read
  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const notificationId = Number(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID." });
      }

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: req.user.id
        }
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found or access denied." });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      return res.json({ message: "Notification marked as read." });
    } catch (error: any) {
      console.error("Mark notification read failed:", error);
      return res.status(500).json({ error: error.message || "Failed to update notification." });
    }
  }

  // Mark all notifications as read for logged in user
  static async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      await prisma.notification.updateMany({
        where: {
          userId: req.user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return res.json({ message: "All notifications marked as read." });
    } catch (error: any) {
      console.error("Mark all notifications read failed:", error);
      return res.status(500).json({ error: error.message || "Failed to update notifications." });
    }
  }

  // Helper to trigger system-wide notifications internally
  static async createHelper(userId: number, title: string, message: string, type: NotificationType) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type
        }
      });
    } catch (err) {
      console.error("Helper failed to create notification:", err);
    }
  }
}
