import { NextRequest, NextResponse } from "next/server";

// POST /api/ai/price-check
// Compares item prices across different Lagos markets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, market } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    const marketPrices: Record<string, Record<string, { price: number; note: string }>> = {
      "Mile 12 Market": {
        tomatoes: { price: 400, note: "Cheapest in Lagos for bulk tomatoes" },
        peppers: { price: 250, note: "Fresh from farms, bulk deals available" },
        onions: { price: 350, note: "Good quality, negotiate for bulk" },
        rice: { price: 42000, note: "Wholesale prices, 50kg bags" },
        beans: { price: 4500, note: "Wide variety available" },
        palm_oil: { price: 3000, note: "Direct from Nnewi suppliers" },
      },
      "Balogun Market": {
        clothing: { price: 5000, note: "Wide variety, negotiate hard" },
        fabric: { price: 4000, note: "Ankara and lace specialist" },
        shoes: { price: 5000, note: "Budget to premium options" },
        electronics: { price: 20000, note: "Compare prices at multiple stalls" },
      },
      "Oshodi Market": {
        rice: { price: 43000, note: "Competitive pricing" },
        garri: { price: 2800, note: "Good quality Ijebu garri" },
        yam: { price: 800, note: "Fresh from the north" },
        plantain: { price: 400, note: "Always fresh" },
      },
      "Alaba International Market": {
        electronics: { price: 18000, note: "Best prices for electronics in Lagos" },
        phone: { price: 65000, note: "New and fairly used options" },
        clothing: { price: 4500, note: "Chinese and local options" },
      },
      "Oyingbo Market": {
        tomatoes: { price: 450, note: "Fresh daily supply" },
        fish: { price: 2500, note: "Frozen and fresh options" },
        crayfish: { price: 1800, note: "Quality guaranteed" },
      },
    };

    const results = items.map((item: { name: string; maxBudget?: number }) => {
      const itemName = item.name.toLowerCase().replace(/\s+/g, "_");
      const currentMarket = market || "Mile 12 Market";

      // Find price in current market
      const marketData = marketPrices[currentMarket];
      const itemPrice = marketData?.[itemName];

      // Find best price across all markets
      let bestMarket = currentMarket;
      let bestPrice = itemPrice?.price || item.maxBudget || 0;

      for (const [mkt, items] of Object.entries(marketPrices)) {
        if (items[itemName] && items[itemName].price < bestPrice) {
          bestMarket = mkt;
          bestPrice = items[itemName].price;
        }
      }

      const savings = (item.maxBudget || bestPrice) - bestPrice;

      return {
        name: item.name,
        currentMarketPrice: itemPrice?.price || null,
        currentMarketNote: itemPrice?.note || "Price not available for this market",
        bestMarket,
        bestPrice,
        savings: savings > 0 ? savings : 0,
        recommendation:
          bestMarket !== currentMarket && savings > 500
            ? `Consider buying at ${bestMarket} to save ₦${savings.toLocaleString()}`
            : bestMarket === currentMarket
            ? `Good deal! ${currentMarket} has competitive prices for this item.`
            : "Price is reasonable at your selected market.",
      };
    });

    const totalSavings = results.reduce((sum, r) => sum + r.savings, 0);

    return NextResponse.json({
      comparisons: results,
      totalSavings,
      message:
        totalSavings > 0
          ? `You could save up to ₦${totalSavings.toLocaleString()} by shopping at different markets.`
          : "Your selected market has good prices for these items.",
    });
  } catch (error) {
    console.error("Price check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
