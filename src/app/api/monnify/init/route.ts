import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentReference, customerName, customerEmail, description } = body;

    const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
    const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
    const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
    const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY || !MONNIFY_CONTRACT_CODE) {
      return NextResponse.json(
        { error: "Monnify credentials not configured" },
        { status: 500 }
      );
    }

    // Step 1: Get Monnify token
    const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString("base64");

    const tokenResponse = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.requestSuccessful) {
      return NextResponse.json(
        { error: "Failed to authenticate with Monnify" },
        { status: 500 }
      );
    }

    const token = tokenData.responseBody.accessToken;

    // Step 2: Initialize transaction
    const transactionResponse = await fetch(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          paymentReference,
          contractCode: MONNIFY_CONTRACT_CODE,
          currencyCode: "NGN",
          customerName,
          customerEmail,
          description,
          redirectUrl: `${APP_URL}/success`,
        }),
      }
    );

    const transactionData = await transactionResponse.json();

    if (!transactionData.requestSuccessful) {
      return NextResponse.json(
        { error: transactionData.responseMessage },
        { status: 400 }
      );
    }

    return NextResponse.json({
      checkoutUrl: transactionData.responseBody.checkoutUrl,
      transactionRef: transactionData.responseBody.transactionRef,
    });
  } catch (error) {
    console.error("Monnify init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
