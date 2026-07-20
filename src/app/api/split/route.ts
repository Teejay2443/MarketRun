import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMonnifyToken } from "@/lib/monnify";
import { getUser } from "@/lib/auth-utils";

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;

// POST /api/split - Create a split payment for an errand
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { errandId } = body;

    if (!errandId) {
      return NextResponse.json({ error: "Errand ID required" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({ where: { id: errandId } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    if (errand.requesterId !== userId) {
      return NextResponse.json({ error: "Only the requester can set up split payment" }, { status: 403 });
    }

    // Calculate split amounts
    const totalAmount = errand.budget + errand.reward;
    const platformFeePercent = 10;
    const shopperPercent = 90;

    // Create split configuration via Monnify SubAccount API
    const token = await getMonnifyToken();

    const splitResponse = await fetch(`${MONNIFY_BASE_URL}/api/v1/subaccounts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `MarketRun Platform Fee - ${errand.title.slice(0, 30)}`,
        contractCode: MONNIFY_CONTRACT_CODE,
        percentCharge: platformFeePercent,
      }),
    });

    const splitData = await splitResponse.json();

    // Log the split creation attempt
    await prisma.auditLog.create({
      data: {
        action: "SPLIT_CONFIG_CREATED",
        entityType: "Errand",
        entityId: errandId,
        userId,
        details: JSON.stringify({
          totalAmount,
          platformFee: (totalAmount * platformFeePercent) / 100,
          shopperPayout: (totalAmount * shopperPercent) / 100,
          splitCode: splitData.responseBody?.splitCode || null,
          monnifyResponse: splitData,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      split: {
        totalAmount,
        platformFeePercent,
        shopperPercent,
        platformFee: Math.round((totalAmount * platformFeePercent) / 100),
        shopperPayout: Math.round((totalAmount * shopperPercent) / 100),
        splitCode: splitData.responseBody?.splitCode || null,
      },
      message: "Split payment configured. 90% goes to shopper, 10% to platform.",
    });
  } catch (error) {
    console.error("Split payment error:", error);
    return NextResponse.json({ error: "Failed to create split payment" }, { status: 500 });
  }
}

// GET /api/split - Get split configuration for an errand
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const errandId = searchParams.get("errandId");

    if (!errandId) {
      return NextResponse.json({ error: "Errand ID required" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({ where: { id: errandId } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    const totalAmount = errand.budget + errand.reward;
    const platformFeePercent = 10;
    const shopperPercent = 90;

    return NextResponse.json({
      totalAmount,
      platformFeePercent,
      shopperPercent,
      platformFee: Math.round((totalAmount * platformFeePercent) / 100),
      shopperPayout: Math.round((totalAmount * shopperPercent) / 100),
    });
  } catch (error) {
    console.error("Get split config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
