import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/monnify";
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

    // Verify webhook signature (skip in sandbox — no signature header)
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.eventType;
    const eventData = event.eventData;

    // Generate deterministic idempotency key from event data (no Date.now())
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${eventType}-${eventData.paymentReference || eventData.transactionReference || ""}`)
      .digest("hex");

    // Check if already processed
    const existingLog = await prisma.webhookLog.findUnique({
      where: { idempotencyKey },
    });

    if (existingLog) {
      console.log(`Webhook already processed: ${idempotencyKey}`);
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    // Log webhook immediately
    await prisma.webhookLog.create({
      data: {
        eventType,
        payload: body,
        signature: signature || "",
        processed: false,
        idempotencyKey,
      },
    });

    // Return 200 immediately per Monnify best practices, process async
    const processAsync = async () => {
      try {
    switch (eventType) {
      case "SUCCESSFUL_COLLECTION":
      case "SUCCESSFUL_TRANSACTION": {
            const paymentRef = eventData.paymentReference || eventData.paymentRef;
            const monnifyRef = eventData.transactionReference || eventData.transactionRef;

            if (paymentRef) {
              const errand = await prisma.errand.findFirst({
                where: { paymentRef },
              });

              if (errand && errand.status === "OPEN") {
                await prisma.errand.update({
                  where: { id: errand.id },
                  data: {
                    status: "FUNDED",
                    monnifyRef: monnifyRef || null,
                    paymentStatus: "PAID",
                  },
                });

                await prisma.auditLog.create({
                  data: {
                    action: "PAYMENT_RECEIVED",
                    entityType: "Errand",
                    entityId: errand.id,
                    details: JSON.stringify({ paymentRef, monnifyRef, amount: errand.budget + errand.reward }),
                  },
                });

                console.log(`Errand ${errand.id} funded via webhook (paymentRef: ${paymentRef})`);
              }
            }
            break;
          }

          case "FAILED_COLLECTION":
      case "FAILED_TRANSACTION": {
            const paymentRef = eventData.paymentReference || eventData.paymentRef;
            console.error(`Payment failed for ref: ${paymentRef}`);

            await prisma.auditLog.create({
              data: {
                action: "PAYMENT_FAILED",
                entityType: "Payment",
                entityId: paymentRef || "unknown",
                details: JSON.stringify({ eventData }),
              },
            });
            break;
          }

          default:
            console.log("Unhandled event type:", eventType);
        }

        await prisma.webhookLog.update({
          where: { idempotencyKey },
          data: { processed: true },
        });
      } catch (error) {
        console.error("Webhook async processing error:", error);
      }
    };

    // Process in background — don't block the 200 response
    processAsync();

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
