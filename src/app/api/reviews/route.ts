import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth-utils";

// POST /api/reviews - Submit a review after completion
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { errandId, rating, comment } = body;

    if (!errandId || !rating) {
      return NextResponse.json({ error: "errandId and rating required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({ where: { id: errandId } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    if (errand.status !== "COMPLETED") {
      return NextResponse.json({ error: "Can only review completed errands" }, { status: 400 });
    }

    if (!errand.shopperId) {
      return NextResponse.json({ error: "No shopper to review" }, { status: 400 });
    }

    if (userId !== errand.requesterId) {
      return NextResponse.json({ error: "Only the requester can leave a review" }, { status: 403 });
    }

    const existing = await prisma.review.findUnique({ where: { errandId } });
    if (existing) {
      return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        errandId,
        reviewerId: userId,
        revieweeId: errand.shopperId,
        rating: Math.round(rating),
        comment: comment || null,
      },
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewee: { select: { id: true, name: true } },
      },
    });

    // Update shopper's average rating
    const agg = await prisma.review.aggregate({
      where: { revieweeId: errand.shopperId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    if (agg._avg.rating) {
      await prisma.user.update({
        where: { id: errand.shopperId },
        data: { rating: Math.round(agg._avg.rating * 10) / 10 },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "REVIEW_SUBMITTED",
        entityType: "Review",
        entityId: review.id,
        userId,
        details: JSON.stringify({ errandId, rating, revieweeId: errand.shopperId }),
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("POST review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/reviews?errandId=xxx OR ?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const errandId = searchParams.get("errandId");
    const revieweeId = searchParams.get("userId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (errandId) {
      where.errandId = errandId;
    } else if (revieweeId) {
      where.revieweeId = revieweeId;
    } else {
      return NextResponse.json({ error: "errandId or userId required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { id: true, name: true } },
        errand: { select: { id: true, title: true, market: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
