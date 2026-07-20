import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth-utils";

// GET /api/audit - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    // Only show logs for the current user's errands
    const userErrands = await prisma.errand.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { shopperId: userId },
        ],
      },
      select: { id: true },
    });

    const errandIds = userErrands.map(e => e.id);

    where.OR = [
      { userId },
      { entityId: { in: errandIds } },
    ];

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
