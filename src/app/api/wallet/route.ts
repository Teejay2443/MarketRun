import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth-utils";
import { disburseFunds, verifyBankAccount } from "@/lib/monnify";

// GET /api/wallet - Get wallet balance + transactions
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, totalEarned: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { errand: { shopperId: userId } },
          { errand: { requesterId: userId } },
        ],
      },
      include: {
        errand: { select: { id: true, title: true, market: true, createdAt: true, requesterId: true, shopperId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const completedJobs = await prisma.errand.count({
      where: { shopperId: userId, status: "COMPLETED" },
    });

    const pendingPayout = await prisma.errand.aggregate({
      where: { shopperId: userId, status: "DELIVERED" },
      _sum: { reward: true },
    });

    return NextResponse.json({
      walletBalance: user.walletBalance,
      totalEarned: user.totalEarned,
      completedJobs,
      pendingPayout: pendingPayout._sum.reward || 0,
      transactions,
    });
  } catch (error) {
    console.error("GET wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/wallet - Withdraw funds via Monnify disbursement
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankCode, accountNumber, accountName } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!bankCode || !accountNumber || !accountName) {
      return NextResponse.json({ error: "Bank code, account number, and account name are required" }, { status: 400 });
    }

    // Verify account with Monnify to get the real account name
    const verified = await verifyBankAccount({ bankCode, accountNumber });
    if (!verified.verified || !verified.accountName) {
      return NextResponse.json({ error: "Invalid bank account. Please check your bank and account number." }, { status: 400 });
    }

    // Use the Monnify-verified account name (not user input)
    const verifiedName = verified.accountName;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.walletBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const withdrawalRef = `WDR-${Date.now()}-${userId.slice(-6)}`;

    // Deduct from wallet first (optimistic)
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amount } },
    });

    // Create withdrawal transaction record
    const transaction = await prisma.transaction.create({
      data: {
        errandId: (await prisma.errand.findFirst({ where: { shopperId: userId }, orderBy: { createdAt: "desc" }, select: { id: true } }))?.id || "",
        amount,
        platformFee: 0,
        shopperPayout: amount,
        monnifyRef: withdrawalRef,
        status: "PENDING",
      },
    });

    try {
      // Initiate Monnify disbursement
      await disburseFunds({
        amount,
        bankCode,
        accountNumber,
        accountName: verifiedName,
        narration: `MarketRun wallet withdrawal for ${user.name}`,
        reference: withdrawalRef,
      });

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "PAID" },
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal of ₦${amount.toLocaleString()} initiated. Funds will be sent to ${verifiedName} within 24 hours.`,
        newBalance: user.walletBalance - amount,
        reference: withdrawalRef,
      });
    } catch (disbursementError) {
      // Rollback wallet deduction on failure
      await prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      console.error("Disbursement error:", disbursementError);
      return NextResponse.json(
        { error: "Failed to process withdrawal. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("POST wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
