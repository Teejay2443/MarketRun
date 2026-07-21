import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth-utils";

type NotificationSubscriber = {
  userId: string;
  controller: ReadableStreamDefaultController;
};

const notificationSubscribers: NotificationSubscriber[] = [];

// Helper to send a notification to a specific user via SSE
export function sendNotificationToUser(userId: string, notification: unknown) {
  const deadSubscribers: NotificationSubscriber[] = [];

  for (const sub of notificationSubscribers) {
    if (sub.userId === userId) {
      try {
        const data = `data: ${JSON.stringify(notification)}\n\n`;
        sub.controller.enqueue(new TextEncoder().encode(data));
      } catch {
        deadSubscribers.push(sub);
      }
    }
  }

  for (const dead of deadSubscribers) {
    const idx = notificationSubscribers.indexOf(dead);
    if (idx !== -1) notificationSubscribers.splice(idx, 1);
  }
}

// GET /api/notifications/stream - SSE for real-time notifications
export async function GET(request: NextRequest) {
  const userId = getUser(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      const subscriber: NotificationSubscriber = { userId, controller };
      notificationSubscribers.push(subscriber);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        const idx = notificationSubscribers.indexOf(subscriber);
        if (idx !== -1) notificationSubscribers.splice(idx, 1);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
