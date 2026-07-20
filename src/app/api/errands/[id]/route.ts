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
    const { status, shopperId, paymentRef: newPaymentRef, action } = body;

    const errand = await prisma.errand.findUnique({ where: { id } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Requester can update paymentRef before funding
    if (newPaymentRef && errand.requesterId === userId && !errand.paymentRef) {
      updateData.paymentRef = newPaymentRef;
    }

    // Accept errand (shopper picks it up)
    if (shopperId && errand.status === "OPEN") {
      if (shopperId === errand.requesterId) {
        return NextResponse.json({ error: "You cannot accept your own errand" }, { status: 400 });
      }
      updateData.shopperId = shopperId;
      updateData.status = "ACCEPTED";
    }

    // Handle price update approval/rejection
    if (action === "APPROVE_PRICE") {
      if (errand.requesterId !== userId) {
        return NextResponse.json({ error: "Only the requester can approve price changes" }, { status: 403 });
      }
      if (errand.status !== "PRICE_REVIEW") {
        return NextResponse.json({ error: "Errand is not in price review" }, { status: 400 });
      }
      // Update items and budget if provided
      if (body.items) {
        updateData.items = body.items;
      }
      if (body.budget !== undefined) {
        updateData.budget = body.budget;
      }
      updateData.status = "SHOPPING";
    }

    if (action === "REJECT_PRICE") {
      if (errand.requesterId !== userId) {
        return NextResponse.json({ error: "Only the requester can reject price changes" }, { status: 403 });
      }
      if (errand.status !== "PRICE_REVIEW") {
        return NextResponse.json({ error: "Errand is not in price review" }, { status: 400 });
      }
      updateData.status = "SHOPPING";
    }

    if (status) {
      // Requester: OPEN/ACCEPTED → FUNDED (after Monnify payment)
      if (status === "FUNDED") {
        if (errand.requesterId !== userId) {
          return NextResponse.json({ error: "Only the requester can fund an errand" }, { status: 403 });
        }
        if (errand.status !== "OPEN" && errand.status !== "ACCEPTED") {
          return NextResponse.json({ error: "Errand must be open or accepted to fund" }, { status: 400 });
        }
        if (body.monnifyRef) {
          updateData.monnifyRef = body.monnifyRef;
          updateData.paymentStatus = "PAID";
        }
      }
      // Shopper: ACCEPTED/FUNDED → SHOPPING → DELIVERED
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
      // Shopper: SHOPPING → PRICE_REVIEW (report price issue)
      if (status === "PRICE_REVIEW") {
        if (errand.shopperId !== userId) {
          return NextResponse.json({ error: "Only the assigned shopper can report price issues" }, { status: 403 });
        }
        if (errand.status !== "SHOPPING") {
          return NextResponse.json({ error: "Must be shopping to report price issues" }, { status: 400 });
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
      // Requester: Cancel errand (OPEN or ACCEPTED or FUNDED)
      if (status === "CANCELLED") {
        if (errand.requesterId !== userId) {
          return NextResponse.json({ error: "Only the requester can cancel an errand" }, { status: 403 });
        }
        if (!["OPEN", "ACCEPTED", "FUNDED"].includes(errand.status)) {
          return NextResponse.json({ error: "Cannot cancel errand in current status" }, { status: 400 });
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

    // Log audit for all status changes
    await prisma.auditLog.create({
      data: {
        action: `ERRAND_${updateData.status || "UPDATED"}`,
        entityType: "Errand",
        entityId: id,
        userId,
        details: JSON.stringify({ from: errand.status, to: updateData.status || "unknown" }),
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

    // When cancelled and was funded: create refund record
    if (status === "CANCELLED" && errand.paymentStatus === "PAID") {
      await prisma.transaction.create({
        data: {
          errandId: id,
          amount: errand.budget + errand.reward,
          platformFee: 0,
          shopperPayout: 0,
          monnifyRef: errand.paymentRef,
          status: "REFUNDED",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH errand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
