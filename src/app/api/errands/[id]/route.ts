import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "marketrun-hackathon-secret-2026";

function getUser(request: NextRequest): string | null {
  const token = request.cookies.get("marketrun_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

// GET /api/errands/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const errand = await prisma.errand.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, estate: true, rating: true } },
        shopper: { select: { id: true, name: true, estate: true, rating: true } },
      },
    });

    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    return NextResponse.json(errand);
  } catch (error) {
    console.error("GET errand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/errands/[id] - Update errand status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, shopperId } = body;

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Accept errand (shopper picks it up)
    if (shopperId && errand.status === "OPEN") {
      if (shopperId === errand.requesterId) {
        return NextResponse.json({ error: "You cannot accept your own errand" }, { status: 400 });
      }
      updateData.shopperId = shopperId;
      updateData.status = "ACCEPTED";
    }

    if (status) {
      // Shopper: ACCEPTED → SHOPPING → DELIVERED
      if (["SHOPPING", "DELIVERED"].includes(status)) {
        if (errand.shopperId !== userId) {
          return NextResponse.json({ error: "Only the assigned shopper can do this" }, { status: 403 });
        }
        if (status === "SHOPPING" && errand.status !== "ACCEPTED" && errand.status !== "FUNDED") {
          return NextResponse.json({ error: "Errand must be accepted or funded first" }, { status: 400 });
        }
        if (status === "DELIVERED" && errand.status !== "SHOPPING") {
          return NextResponse.json({ error: "Must be shopping before marking delivered" }, { status: 400 });
        }
      }
      // Requester: DELIVERED → COMPLETED
      if (status === "COMPLETED") {
        if (errand.requesterId !== userId) {
          return NextResponse.json({ error: "Only the requester can confirm delivery" }, { status: 403 });
        }
        if (errand.status !== "DELIVERED") {
          return NextResponse.json({ error: "Errand must be delivered before confirming" }, { status: 400 });
        }
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid updates" }, { status: 400 });
    }

    const updated = await prisma.errand.update({
      where: { id },
      data: updateData,
      include: {
        requester: { select: { id: true, name: true, estate: true, rating: true } },
        shopper: { select: { id: true, name: true, estate: true, rating: true } },
      },
    });

    // When completed: credit wallet + create transaction
    if (status === "COMPLETED" && errand.shopperId) {
      const platformFee = Math.round(errand.reward * 0.1);
      const shopperPayout = errand.reward - platformFee;

      await prisma.transaction.create({
        data: {
          errandId: id,
          amount: errand.reward,
          platformFee,
          shopperPayout,
          monnifyRef: errand.paymentRef,
          status: "PAID",
        },
      });

      await prisma.user.update({
        where: { id: errand.shopperId },
        data: {
          walletBalance: { increment: shopperPayout },
          totalEarned: { increment: shopperPayout },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH errand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
