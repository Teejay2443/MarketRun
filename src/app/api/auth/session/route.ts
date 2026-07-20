import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("marketrun_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, estate: true, role: true, rating: true, walletBalance: true, totalEarned: true, reservedAccountNumber: true, reservedAccountBank: true, kycStatus: true },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
