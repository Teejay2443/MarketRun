import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createInvoice } from "@/lib/monnify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "marketrun-hackathon-secret-2026";

function getUser(request: NextRequest): string | null {
  const token = request.cookies.get("marketrun_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

// POST /api/invoices - Create invoice for an errand
export async function POST(request: NextRequest) {
  try {
    const userId = getUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { errandId } = body;

    if (!errandId) {
      return NextResponse.json({ error: "Errand ID required" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({ where: { id: errandId } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    if (errand.requesterId !== userId) {
      return NextResponse.json({ error: "Only the requester can create an invoice" }, { status: 403 });
    }

    // Parse items for line items
    const items = JSON.parse(errand.items);
    const lineItems = items.map((item: { name: string; quantity: string; brand?: string; maxBudget: number }) => ({
      name: item.name,
      description: `${item.quantity}${item.brand ? ` - ${item.brand}` : ""}`,
      quantity: 1,
      unitPrice: item.maxBudget,
    }));

    // Add reward as line item
    lineItems.push({
      name: "Shopper Reward",
      description: "Payment for shopping service",
      quantity: 1,
      unitPrice: errand.reward,
    });

    const totalAmount = errand.budget + errand.reward;

    // Create invoice via Monnify
    const invoice = await createInvoice({
      amount: totalAmount,
      description: `Invoice for: ${errand.title}`,
      customerName: "MarketRun Customer",
      customerEmail: "customer@marketrun.com",
      lineItems,
    });

    // Update errand with invoice details
    await prisma.errand.update({
      where: { id: errandId },
      data: {
        invoiceId: invoice.invoiceId,
        invoiceUrl: invoice.invoiceUrl,
        invoiceRef: invoice.paymentReference,
        paymentRef: invoice.paymentReference,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: "INVOICE_CREATED",
        entityType: "Errand",
        entityId: errandId,
        userId,
        details: JSON.stringify({
          invoiceId: invoice.invoiceId,
          totalAmount,
          lineItemCount: lineItems.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.invoiceId,
        url: invoice.invoiceUrl,
        paymentReference: invoice.paymentReference,
        totalAmount,
        lineItems,
        errand: {
          id: errand.id,
          title: errand.title,
        },
      },
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}

// GET /api/invoices - Get invoice for an errand
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const errandId = searchParams.get("errandId");

    if (!errandId) {
      return NextResponse.json({ error: "Errand ID required" }, { status: 400 });
    }

    const errand = await prisma.errand.findUnique({ where: { id: errandId } });
    if (!errand) {
      return NextResponse.json({ error: "Errand not found" }, { status: 404 });
    }

    const items = JSON.parse(errand.items);
    const lineItems = items.map((item: { name: string; quantity: string; brand?: string; maxBudget: number }) => ({
      name: item.name,
      description: `${item.quantity}${item.brand ? ` - ${item.brand}` : ""}`,
      quantity: 1,
      unitPrice: item.maxBudget,
    }));

    lineItems.push({
      name: "Shopper Reward",
      description: "Payment for shopping service",
      quantity: 1,
      unitPrice: errand.reward,
    });

    return NextResponse.json({
      invoiceId: errand.invoiceId,
      invoiceUrl: errand.invoiceUrl,
      paymentReference: errand.invoiceRef || errand.paymentRef,
      totalAmount: errand.budget + errand.reward,
      lineItems,
      status: errand.paymentStatus || "PENDING",
      errand: {
        id: errand.id,
        title: errand.title,
        market: errand.market,
        createdAt: errand.createdAt,
      },
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
