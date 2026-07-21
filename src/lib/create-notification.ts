import { prisma } from "@/lib/db";
import { sendNotificationToUser } from "@/app/api/notifications/stream/route";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  errandId?: string;
}

export async function createNotification({ userId, type, title, message, errandId }: CreateNotificationParams) {
  try {
    // Persist to DB
    const notification = await prisma.notification.create({
      data: { userId, type, title, message, errandId },
    });

    // Push via SSE in real-time
    sendNotificationToUser(userId, { type: "NOTIFICATION", notification });

    return notification;
  } catch (error) {
    console.error("createNotification error:", error);
  }
}
