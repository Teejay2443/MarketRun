import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";

// POST /api/auth/verify-email - Verify OTP code
export async function POST(request: NextRequest) {
  try {
    const { email, code, purpose = "signup" } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const isValid = verifyOTP(email.trim().toLowerCase(), code.trim(), purpose);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
