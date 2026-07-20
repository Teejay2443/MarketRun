import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storeOTP } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

// POST /api/auth/forgot-password - Send reset code
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true, message: "If an account exists with this email, a reset code has been sent." });
    }

    // Generate and store OTP
    const code = storeOTP(email, "reset-password");

    // Send email
    await sendVerificationEmail(email, code, "reset-password");

    // In dev, include code in response
    const response: Record<string, unknown> = {
      success: true,
      message: "If an account exists with this email, a reset code has been sent.",
    };

    if (process.env.NODE_ENV !== "production") {
      response.devCode = code;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
