import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processRefund } from "@/lib/monnify";
import { getUser } from "@/lib/auth-utils";

// POST /api/refunds - Process a refund for an errand
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { errandId, amount, reason } = body;

    if (!errandId || !reason) {
      return NextResponse.json({ error: "Errand ID and reason required" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({
      where: { id: errandId },
      include: { transactions: true },
    });

    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    // Only requester can request refund
    if (errand.requesterId !== userId) {
      return NextResponse.json({ error: "Only the requester can request a refund" }, { status: 403 });
    }

    // Errand must be completed to refund
    if (errand.status !== "COMPLETED" && errand.status !== "DELIVERED") {
      return NextResponse.json({ error: "Errand must be completed or delivered to refund" }, { status: 400 });
    }

    const transaction = errand.transactions[0];
    if (!transaction || !transaction.monnifyRef) {
      return NextResponse.json({ error: "No transaction found for this errand" }, { status: 400 });
    }

    // Process refund via Monnify
    const refundAmount = amount || errand.budget + errand.reward;
    const refund = await processRefund({
      transactionReference: transaction.monnifyRef,
      amount: refundAmount,
      reason,
    });

    // Update errand status
    await prisma.errand.update({
      where: { id: errandId },
      data: { status: "REFUNDED" },
    });

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "REFUNDED" },
    });

    // If partial refund, deduct from shopper wallet
    if (errand.shopperId && refundAmount < (errand.budget + errand.reward)) {
      const deduction = (errand.budget + errand.reward) - refundAmount;
      await prisma.user.update({
        where: { id: errand.shopperId },
        data: { walletBalance: { decrement: deduction } },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "REFUND_PROCESSED",
        entityType: "Errand",
        entityId: errandId,
        userId,
        details: JSON.stringify({ amount: refundAmount, reason, refundReference: refund.refundReference }),
      },
    });

    return NextResponse.json({
      success: true,
      refundReference: refund.refundReference,
      amount: refundAmount,
      message: `Refund of ₦${refundAmount.toLocaleString()} initiated successfully`,
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Refund processing failed" }, { status: 500 });
  }
}
