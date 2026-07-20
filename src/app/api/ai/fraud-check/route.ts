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

interface FraudFlag {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
}

async function analyzeErrand(errandId: string): Promise<FraudFlag[]> {
  const flags: FraudFlag[] = [];

  const errand = await prisma.errand.findUnique({
    where: { id: errandId },
    include: {
      requester: true,
      messages: true,
    },
  });

  if (!errand) return flags;

  // Rule 1: Unusually high budget (>₦100,000)
  if (errand.budget > 100000) {
    flags.push({
      type: "HIGH_BUDGET",
      severity: "medium",
      message: `Unusually high budget of ₦${errand.budget.toLocaleString()} detected. Verify items match the amount.`,
    });
  }

  // Rule 2: Very low reward relative to budget (< 5%)
  if (errand.budget > 0 && errand.reward / errand.budget < 0.05) {
    flags.push({
      type: "LOW_REWARD",
      severity: "low",
      message: "Reward is very low compared to budget. This may deter shoppers.",
    });
  }

  // Rule 3: Requester has created many errands recently (potential spam)
  const recentErrands = await prisma.errand.count({
    where: {
      requesterId: errand.requesterId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  if (recentErrands > 5) {
    flags.push({
      type: "HIGH_VOLUME",
      severity: "medium",
      message: `${recentErrands} errands created in the last 24 hours. Possible bulk posting.`,
    });
  }

  // Rule 4: Errand cancelled/refunded multiple times (pattern)
  const cancelledCount = await prisma.errand.count({
    where: {
      requesterId: errand.requesterId,
      status: "COMPLETED",
      transactions: { some: { status: "REFUNDED" } },
    },
  });

  if (cancelledCount > 2) {
    flags.push({
      type: "REPEAT_REFUND",
      severity: "high",
      message: `Requester has ${cancelledCount} refunded errands. Potential abuse.`,
    });
  }

  // Rule 5: Very new account (< 1 day old)
  const accountAge = Date.now() - new Date(errand.requester.createdAt).getTime();
  if (accountAge < 24 * 60 * 60 * 1000) {
    flags.push({
      type: "NEW_ACCOUNT",
      severity: "low",
      message: "Errand created by a brand new account. Monitor for abuse.",
    });
  }

  // Rule 6: Delivery address far from estate (inconsistency)
  if (errand.address && errand.estate) {
    const addrLower = errand.address.toLowerCase();
    const estateLower = errand.estate.toLowerCase();
    const addrWords = addrLower.split(/\s+/);
    const hasOverlap = addrWords.some(
      (w) => w.length > 3 && estateLower.includes(w)
    );
    if (!hasOverlap && addrWords.length > 1) {
      flags.push({
        type: "ADDRESS_MISMATCH",
        severity: "low",
        message: "Delivery address may not match stated estate. Verify location.",
      });
    }
  }

  return flags;
}

// POST /api/ai/fraud-check
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { errandId } = body;

    if (!errandId) {
      return NextResponse.json({ error: "errandId required" }, { status: 400 });
    }

    const flags = await analyzeErrand(errandId);

    const riskScore = flags.reduce((score, flag) => {
      if (flag.severity === "high") return score + 40;
      if (flag.severity === "medium") return score + 20;
      return score + 5;
    }, 0);

    const riskLevel = riskScore >= 60 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW";

    return NextResponse.json({
      errandId,
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      flags,
      recommendation:
        riskLevel === "HIGH"
          ? "Manual review recommended before accepting this errand."
          : riskLevel === "MEDIUM"
          ? "Proceed with caution. Monitor for unusual activity."
          : "No significant fraud indicators detected.",
    });
  } catch (error) {
    console.error("Fraud check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/ai/fraud-check - Get platform-wide fraud summary
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stats for the dashboard
    const totalErrands = await prisma.errand.count();
    const openErrands = await prisma.errand.count({ where: { status: "OPEN" } });
    const completedErrands = await prisma.errand.count({ where: { status: "COMPLETED" } });
    const activeShoppers = await prisma.errand.groupBy({
      by: ["shopperId"],
      where: { status: { in: ["ACCEPTED", "SHOPPING", "DELIVERED"] } },
    });

    const highBudgetErrands = await prisma.errand.count({
      where: { budget: { gt: 100000 } },
    });

    return NextResponse.json({
      platform: {
        totalErrands,
        openErrands,
        completedErrands,
        activeShoppers: activeShoppers.length,
        highBudgetFlagged: highBudgetErrands,
      },
      message: "Platform health check complete.",
    });
  } catch (error) {
    console.error("Fraud stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
