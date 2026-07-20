import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth-utils";
import { broadcastMessage } from "@/app/api/messages/stream/route";

// GET /api/messages?errandId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const errandId = searchParams.get("errandId");

    if (!errandId) {
      return NextResponse.json({ error: "errandId required" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({ where: { id: errandId } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    if (errand.requesterId !== userId && errand.shopperId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { errandId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { errandId, content } = body;

    if (!errandId || !content || !content.trim()) {
      return NextResponse.json({ error: "errandId and content required" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({ where: { id: errandId } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    if (errand.requesterId !== userId && errand.shopperId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        errandId,
        senderId: userId,
        content: content.trim(),
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    // Broadcast to SSE subscribers
    broadcastMessage(errandId, message);

    return NextResponse.json(message);
  } catch (error) {
    console.error("POST message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
