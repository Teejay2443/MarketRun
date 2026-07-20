import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "marketrun-hackathon-secret-2026";
const PAGE_SIZE = 12;

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

// GET /api/errands - List all errands (with filters + pagination)
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market");
    const status = searchParams.get("status");
    const mine = searchParams.get("mine");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || String(PAGE_SIZE));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Exclude COMPLETED errands from public listings
    if (mine !== "requester" && mine !== "shopper") {
      if (status && status !== "all") {
        where.status = status;
      } else {
        where.status = { not: "COMPLETED" };
      }
    } else if (status && status !== "all") {
      where.status = status;
    }

    if (market && market !== "all") {
      where.market = { contains: market, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { market: { contains: search, mode: "insensitive" } },
      ];
    }

    if (mine === "requester" && userId) {
      where.requesterId = userId;
    } else if (mine === "shopper" && userId) {
      where.shopperId = userId;
    } else if (!userId) {
      where.status = "OPEN";
    }

    const [errands, total] = await Promise.all([
      prisma.errand.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, estate: true, rating: true } },
          shopper: { select: { id: true, name: true, estate: true, rating: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.errand.count({ where }),
    ]);

    return NextResponse.json({
      errands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("GET errands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/errands - Create a new errand
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, market, items, budget, reward, address, estate, paymentRef } = body;

    if (!title || !description || !market || !items || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const errand = await prisma.errand.create({
      data: {
        title,
        description,
        market,
        items: JSON.stringify(items),
        budget,
        reward,
        address,
        estate: estate || null,
        requesterId: userId,
        status: "OPEN",
        paymentRef: paymentRef || null,
      },
      include: {
        requester: { select: { id: true, name: true, estate: true, rating: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "ERRAND_CREATED",
        entityType: "Errand",
        entityId: errand.id,
        userId,
        details: JSON.stringify({ title, market, budget, reward }),
      },
    });

    return NextResponse.json(errand);
  } catch (error) {
    console.error("POST errand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
