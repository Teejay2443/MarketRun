import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("monnify-signature");

    const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;

    if (!MONNIFY_SECRET_KEY) {
      console.error("Monnify secret key not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Verify webhook signature
    const expectedHash = crypto
      .createHmac("sha512", MONNIFY_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (signature !== expectedHash) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.eventType;
    const eventData = event.eventData;

    switch (eventType) {
      case "SUCCESSFUL_COLLECTION": {
        const paymentRef = eventData.paymentReference || eventData.paymentRef;
        const monnifyRef = eventData.transactionReference || eventData.transactionRef;

        if (paymentRef) {
          // Find errand by paymentRef
          const errand = await prisma.errand.findFirst({
            where: { paymentRef },
          });

          if (errand && errand.status === "OPEN") {
            // Update errand to FUNDED
            await prisma.errand.update({
              where: { id: errand.id },
              data: {
                status: "FUNDED",
                monnifyRef: monnifyRef || null,
                paymentStatus: "PAID",
              },
            });
            console.log(`Errand ${errand.id} funded via webhook (paymentRef: ${paymentRef})`);
          }
        }
        break;
      }

      case "FAILED_COLLECTION": {
        const paymentRef = eventData.paymentReference || eventData.paymentRef;
        console.error(`Payment failed for ref: ${paymentRef}`);
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
