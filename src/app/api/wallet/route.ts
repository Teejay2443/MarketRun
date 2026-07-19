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
        errand: { shopperId: userId },
      },
      include: {
        errand: { select: { id: true, title: true, market: true, createdAt: true } },
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

// POST /api/wallet - Withdraw funds
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankName, accountNumber, accountName } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

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

    // Deduct from wallet
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amount } },
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal of ₦${amount.toLocaleString()} initiated. Funds will be sent to ${bankName} account ${accountNumber} (${accountName}) within 24 hours.`,
      newBalance: user.walletBalance - amount,
    });
  } catch (error) {
    console.error("POST wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
