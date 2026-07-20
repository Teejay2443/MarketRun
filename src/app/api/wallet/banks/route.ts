import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { getBanks } from "@/lib/monnify";

// GET /api/wallet/banks - Fetch all supported banks from Monnify
export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banks = await getBanks();

    return NextResponse.json({
      success: true,
      banks: banks.map((b) => ({ name: b.name, code: b.code })),
    });
  } catch (error) {
    console.error("Get banks error:", error);
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 });
  }
}
