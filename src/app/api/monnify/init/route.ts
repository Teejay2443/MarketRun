import { NextRequest, NextResponse } from "next/server";
import { initializeTransaction } from "@/lib/monnify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentReference, customerName, customerEmail, description, splitCode } = body;

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await initializeTransaction({
      amount,
      paymentReference,
      customerName,
      customerEmail,
      description,
      redirectUrl: `${APP_URL}/success`,
      splitCode,
    });

    return NextResponse.json({
      checkoutUrl: result.responseBody.checkoutUrl,
      transactionRef: result.responseBody.transactionRef,
    });
  } catch (error) {
    console.error("Monnify init error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
