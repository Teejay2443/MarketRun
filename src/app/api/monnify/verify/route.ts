import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionRef = searchParams.get("ref");

    if (!transactionRef) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 }
      );
    }

    const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
    const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
    const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;

    if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
      return NextResponse.json(
        { error: "Monnify credentials not configured" },
        { status: 500 }
      );
    }

    // Get Monnify token
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

    // Verify transaction
    const verifyResponse = await fetch(
      `${MONNIFY_BASE_URL}/api/v1/merchant/transactions/verify/${transactionRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.requestSuccessful) {
      return NextResponse.json(
        { error: verifyData.responseMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(verifyData.responseBody);
  } catch (error) {
    console.error("Monnify verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
