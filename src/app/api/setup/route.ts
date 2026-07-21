import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// One-time setup: POST /api/setup?secret=marketrun-admin-setup-2026
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== "marketrun-admin-setup-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Missing email or role" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
