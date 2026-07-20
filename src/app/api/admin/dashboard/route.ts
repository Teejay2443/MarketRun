import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth-utils";

// GET /api/admin/dashboard - Platform metrics (admin only)
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Total users
    const totalUsers = await prisma.user.count();

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    // Total errands
    const totalErrands = await prisma.errand.count();

    // Errands by status
    const errandsByStatus = await prisma.errand.groupBy({
      by: ["status"],
      _count: true,
    });

    // Total transactions
    const totalTransactions = await prisma.transaction.count();
    const totalTransactionVolume = await prisma.transaction.aggregate({
      _sum: { amount: true, platformFee: true, shopperPayout: true },
    });

    // Transactions by status
    const transactionsByStatus = await prisma.transaction.groupBy({
      by: ["status"],
      _count: true,
    });

    // Recent errands (last 10)
    const recentErrands = await prisma.errand.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        reward: true,
        createdAt: true,
        requester: { select: { name: true } },
        shopper: { select: { name: true } },
      },
    });

    // Top shoppers by completed errands
    const topShoppers = await prisma.user.findMany({
      where: { role: "shopper" },
      select: {
        id: true,
        name: true,
        rating: true,
        totalEarned: true,
        _count: { select: { errandsAsShopper: { where: { status: "COMPLETED" } } } },
      },
      orderBy: { totalEarned: "desc" },
      take: 5,
    });

    // Active errands (not completed or cancelled)
    const activeErrands = await prisma.errand.count({
      where: { status: { in: ["OPEN", "ACCEPTED", "FUNDED", "SHOPPING", "PRICE_REVIEW"] } },
    });

    // Pending payouts (delivered but not completed)
    const pendingPayouts = await prisma.errand.aggregate({
      where: { status: "DELIVERED" },
      _sum: { reward: true },
    });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayErrands = await prisma.errand.count({
      where: { createdAt: { gte: today } },
    });
    const todayTransactions = await prisma.transaction.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { amount: true },
      _count: true,
    });

    // Webhook stats
    const totalWebhooks = await prisma.webhookLog.count();
    const processedWebhooks = await prisma.webhookLog.count({ where: { processed: true } });

    // Audit log count
    const totalAuditLogs = await prisma.auditLog.count();

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {}),
      },
      errands: {
        total: totalErrands,
        active: activeErrands,
        byStatus: errandsByStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
        today: todayErrands,
      },
      transactions: {
        total: totalTransactions,
        volume: totalTransactionVolume._sum.amount || 0,
        platformFees: totalTransactionVolume._sum.platformFee || 0,
        shopperPayouts: totalTransactionVolume._sum.shopperPayout || 0,
        byStatus: transactionsByStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
        todayCount: todayTransactions._count,
        todayVolume: todayTransactions._sum.amount || 0,
      },
      payouts: {
        pending: pendingPayouts._sum.reward || 0,
      },
      webhooks: {
        total: totalWebhooks,
        processed: processedWebhooks,
        successRate: totalWebhooks > 0 ? Math.round((processedWebhooks / totalWebhooks) * 100) : 100,
      },
      auditLogs: totalAuditLogs,
      recentErrands,
      topShoppers: topShoppers.map((s) => ({
        id: s.id,
        name: s.name,
        rating: s.rating,
        totalEarned: s.totalEarned,
        completedJobs: s._count.errandsAsShopper,
      })),
    });
  } catch (error) {
    console.error("GET admin dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
