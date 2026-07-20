import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-utils";
import { verifyBankAccount } from "@/lib/monnify";

// POST /api/wallet/verify-account - Lookup account name via Monnify
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bankCode, accountNumber } = body;

    if (!bankCode || !accountNumber) {
      return NextResponse.json({ error: "Bank code and account number are required" }, { status: 400 });
    }

    if (accountNumber.length !== 10 || !/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ error: "Account number must be exactly 10 digits" }, { status: 400 });
    }

    const result = await verifyBankAccount({ bankCode, accountNumber });

    if (!result.verified) {
      return NextResponse.json({ error: "Invalid account number or bank code" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      accountName: result.accountName,
      accountNumber: result.accountNumber,
      bankCode: result.bankCode,
    });
  } catch (error) {
    console.error("Verify account error:", error);
    return NextResponse.json({ error: "Failed to verify account" }, { status: 500 });
  }
}
