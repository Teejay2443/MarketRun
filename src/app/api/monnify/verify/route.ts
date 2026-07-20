import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/monnify";
import { getUser } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionRef = searchParams.get("ref");

    if (!transactionRef) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 }
      );
    }

    const data = await verifyTransaction(transactionRef);
    return NextResponse.json(data.responseBody);
  } catch (error) {
    console.error("Monnify verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
