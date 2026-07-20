import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storeOTP } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

// POST /api/auth/send-verification - Send OTP to email
export async function POST(request: NextRequest) {
  try {
    const { email, purpose = "signup" } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (purpose === "signup") {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (existingUser) {
        return NextResponse.json({ error: "Email already registered. Please sign in instead." }, { status: 409 });
      }
    }

    if (purpose === "login") {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!existingUser) {
        return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
      }
    }

    // Generate and store OTP
    const code = storeOTP(email.trim().toLowerCase(), purpose);

    // Send email
    const sent = await sendVerificationEmail(email.trim().toLowerCase(), code, purpose);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
      // In development, include code in response for testing
      ...(process.env.NODE_ENV !== "production" && { code }),
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
