import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyBVN } from "@/lib/monnify";
import { getUser } from "@/lib/auth-utils";

// POST /api/kyc - Verify user's BVN
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

    const body = await request.json();
    const { bvn } = body;

    if (!bvn || bvn.length !== 11) {
      return NextResponse.json({ error: "Valid 11-digit BVN required" }, { status: 400 });
    }

    // Verify with Monnify
    const result = await verifyBVN(bvn);

    if (result.verified) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: "VERIFIED",
          kycBvn: bvn,
          kycVerifiedAt: new Date(),
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: "KYC_VERIFIED",
          entityType: "User",
          entityId: userId,
          userId,
          details: JSON.stringify({ bvn, fullName: result.fullName }),
        },
      });

      return NextResponse.json({
        verified: true,
        fullName: result.fullName,
        message: "BVN verified successfully",
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: "BVN verification failed",
      });
    }
  } catch (error) {
    console.error("KYC verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

// GET /api/kyc - Get KYC status
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycVerifiedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get KYC status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
