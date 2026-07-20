import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth-utils";

// In-memory subscriber list for SSE
type Subscriber = {
  errandId: string;
  controller: ReadableStreamDefaultController;
  userId: string;
};

const subscribers: Subscriber[] = [];

// Helper to broadcast new message to all subscribers of an errand
export function broadcastMessage(errandId: string, message: unknown) {
  const deadSubscribers: Subscriber[] = [];

  for (const sub of subscribers) {
    if (sub.errandId === errandId) {
      try {
        const data = `data: ${JSON.stringify(message)}\n\n`;
        sub.controller.enqueue(new TextEncoder().encode(data));
      } catch {
        deadSubscribers.push(sub);
      }
    }
  }

  // Clean up dead connections
  for (const dead of deadSubscribers) {
    const idx = subscribers.indexOf(dead);
    if (idx !== -1) subscribers.splice(idx, 1);
  }
}

// Helper to broadcast errand status changes
export function broadcastStatusChange(errandId: string, status: string, extra?: Record<string, unknown>) {
  const deadSubscribers: Subscriber[] = [];
  const payload = { type: "STATUS_CHANGE", errandId, status, ...extra };

  for (const sub of subscribers) {
    if (sub.errandId === errandId) {
      try {
        const data = `data: ${JSON.stringify(payload)}\n\n`;
        sub.controller.enqueue(new TextEncoder().encode(data));
      } catch {
        deadSubscribers.push(sub);
      }
    }
  }

  for (const dead of deadSubscribers) {
    const idx = subscribers.indexOf(dead);
    if (idx !== -1) subscribers.splice(idx, 1);
  }
}

// GET /api/messages/stream?errandId=xxx - SSE stream for real-time messages
export async function GET(request: NextRequest) {
  const userId = getUser(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { searchParams } = new URL(request.url);
  const errandId = searchParams.get("errandId");

  if (!errandId) {
    return new Response(JSON.stringify({ error: "errandId required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const errand = await prisma.errand.findUnique({ where: { id: errandId } });
  if (!errand || (errand.requesterId !== userId && errand.shopperId !== userId)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      const subscriber: Subscriber = { errandId, controller, userId };
      subscribers.push(subscriber);

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        const idx = subscribers.indexOf(subscriber);
        if (idx !== -1) subscribers.splice(idx, 1);
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
