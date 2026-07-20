import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createReservedAccount } from "@/lib/monnify";
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

// POST /api/reserved-account - Create a reserved account for user
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a reserved account
    if (user.reservedAccountNumber) {
      return NextResponse.json({
        accountNumber: user.reservedAccountNumber,
        bankName: user.reservedAccountBank,
        accountReference: user.reservedAccountRef,
      });
    }

    const body = await request.json();
    const { bvn } = body;

    if (!bvn || bvn.length !== 11) {
      return NextResponse.json({ error: "Valid 11-digit BVN required" }, { status: 400 });
    }

    // Create reserved account with Monnify
    const accountRef = `MRN-${userId.slice(-8)}-${Date.now()}`;
    const account = await createReservedAccount({
      accountReference: accountRef,
      accountName: `MarketRun - ${user.name}`,
      customerEmail: user.email,
      customerName: user.name,
      bvn,
    });

    // Update user with reserved account details
    await prisma.user.update({
      where: { id: userId },
      data: {
        reservedAccountNumber: account.accountNumber,
        reservedAccountBank: account.bankName,
        reservedAccountRef: account.accountReference,
        kycBvn: bvn,
        kycStatus: "PENDING",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "RESERVED_ACCOUNT_CREATED",
        entityType: "User",
        entityId: userId,
        userId,
        details: JSON.stringify({ accountNumber: account.accountNumber, bankName: account.bankName }),
      },
    });

    return NextResponse.json({
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      accountReference: account.accountReference,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create reserved account";
    console.error("Reserved account error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/reserved-account - Get user's reserved account
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        reservedAccountNumber: true,
        reservedAccountBank: true,
        reservedAccountRef: true,
        kycStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get reserved account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
