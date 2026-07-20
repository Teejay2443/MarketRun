import { NextRequest, NextResponse } from "next/server";

// Market-specific item knowledge base
// This acts as our "AI" - a curated knowledge graph of Nigerian market items,
// typical prices, and common shopping patterns per market type

interface MarketItemSuggestion {
  name: string;
  quantity: string;
  maxBudget: number;
  confidence: number;
  category: string;
}

interface MarketPriceRange {
  min: number;
  max: number;
  typical: number;
  unit: string;
}

// Comprehensive Nigerian market item database with real-ish prices (NGN)
const MARKET_ITEMS: Record<string, MarketPriceRange> = {
  "tomatoes": { min: 200, max: 800, typical: 500, unit: "per basket/bag" },
  "peppers": { min: 100, max: 500, typical: 300, unit: "per basket" },
  "onions": { min: 200, max: 600, typical: 400, unit: "per bag" },
  "rice": { min: 3000, max: 80000, typical: 45000, unit: "per 50kg bag" },
  "garri": { min: 1500, max: 5000, typical: 3000, unit: "per paint" },
  "beans": { min: 2000, max: 8000, typical: 5000, unit: "per paint" },
  "yam": { min: 500, max: 2000, typical: 1000, unit: "per tuber" },
  "plantain": { min: 300, max: 800, typical: 500, unit: "per bunch" },
  "palm oil": { min: 2000, max: 6000, typical: 3500, unit: "per litre" },
  "groundnut oil": { min: 3000, max: 8000, typical: 5000, unit: "per litre" },
  "chicken": { min: 3000, max: 10000, typical: 6000, unit: "per kg" },
  "fish": { min: 1500, max: 5000, typical: 3000, unit: "per kg" },
  "beef": { min: 2500, max: 5000, typical: 3500, unit: "per kg" },
  "goat meat": { min: 4000, max: 8000, typical: 6000, unit: "per kg" },
  "crayfish": { min: 1000, max: 4000, typical: 2000, unit: "per wrap" },
  "stockfish": { min: 2000, max: 6000, typical: 3500, unit: "per piece" },
  "dried fish": { min: 1500, max: 5000, typical: 3000, unit: "per piece" },
  "maggi": { min: 200, max: 500, typical: 350, unit: "per cube (10 pack)" },
  "salt": { min: 100, max: 300, typical: 200, unit: "per pack" },
  "sugar": { min: 500, max: 1500, typical: 800, unit: "per kg" },
  "flour": { min: 800, max: 2000, typical: 1200, unit: "per kg" },
  "spaghetti": { min: 200, max: 500, typical: 350, unit: "per pack" },
  "noodles": { min: 150, max: 300, typical: 200, unit: "per pack" },
  "bread": { min: 500, max: 1500, typical: 800, unit: "per loaf" },
  "milk": { min: 500, max: 2000, typical: 1000, unit: "per tin" },
  "egg": { min: 1500, max: 3500, typical: 2500, unit: "per crate" },
  "water": { min: 300, max: 800, typical: 500, unit: "per sachet (bag of 12)" },
  "fruit juice": { min: 500, max: 1500, typical: 800, unit: "per bottle" },
  "cooking gas": { min: 5000, max: 15000, typical: 8000, unit: "per 12kg cylinder fill" },
  "diapers": { min: 2000, max: 6000, typical: 3500, unit: "per pack" },
  "soap": { min: 200, max: 800, typical: 400, unit: "per bar" },
  "detergent": { min: 500, max: 2000, typical: 1000, unit: "per pack" },
  "tissue": { min: 300, max: 800, typical: 500, unit: "per pack" },
  "baby items": { min: 2000, max: 10000, typical: 5000, unit: "assorted" },
  "clothing": { min: 2000, max: 20000, typical: 8000, unit: "per piece" },
  "shoes": { min: 3000, max: 15000, typical: 6000, unit: "per pair" },
  "fabric": { min: 2000, max: 30000, typical: 8000, unit: "per yard" },
  "ankara": { min: 2000, max: 15000, typical: 5000, unit: "per yard" },
  "electronics": { min: 5000, max: 100000, typical: 25000, unit: "varies" },
  "phone": { min: 20000, max: 500000, typical: 80000, unit: "varies" },
  "medication": { min: 500, max: 5000, typical: 2000, unit: "varies" },
  "cosmetics": { min: 500, max: 5000, typical: 2000, unit: "varies" },
};

// Errand title pattern matching → suggested items
const TITLE_PATTERNS: Record<string, string[]> = {
  "cooking": ["tomatoes", "peppers", "onions", "palm oil", "maggi", "salt", "crayfish"],
  "party": ["rice", "chicken", "palm oil", "onions", "tomatoes", "plantain", "beer", "water"],
  "baby": ["diapers", "baby items", "milk", "water"],
  "grocery": ["rice", "beans", "garri", "tomatoes", "peppers", "onions", "palm oil", "maggi"],
  "soup": ["tomatoes", "peppers", "onions", "crayfish", "stockfish", "dried fish", "palm oil", "maggi"],
  "stew": ["tomatoes", "peppers", "onions", "chicken", "palm oil", "maggi"],
  "jollof": ["rice", "tomatoes", "peppers", "onions", "chicken", "tomato paste"],
  "fried rice": ["rice", "carrots", "green beans", "chicken", "seasoning"],
  "salad": ["lettuce", "tomatoes", "cucumber", "carrots", "cabbage"],
  "fruit": ["apples", "bananas", "oranges", "watermelon", "grapes"],
  "meat": ["beef", "chicken", "goat meat", "fish"],
  "fish": ["fish", "crayfish", "stockfish", "dried fish"],
  "vegetable": ["tomatoes", "peppers", "onions", "lettuce", "cabbage", "carrots"],
  "spice": ["maggi", "salt", "curry", "thyme", "pepper"],
  "snack": ["bread", "egg", "spaghetti", "noodles"],
  "drink": ["water", "fruit juice", "soda"],
  "cleaning": ["soap", "detergent", "tissue"],
  "wash": ["soap", "detergent"],
  "market": ["tomatoes", "peppers", "onions", "rice", "beans"],
  "weekend": ["chicken", "rice", "plantain", "egg", "bread"],
  "breakfast": ["bread", "egg", "milk", "sugar"],
  "lunch": ["rice", "beans", "chicken", "vegetables"],
  "dinner": ["rice", "fish", "vegetables", "soup"],
  "food": ["rice", "beans", "tomatoes", "peppers", "onions", "palm oil"],
  "shopping": ["rice", "beans", "tomatoes", "peppers", "onions"],
  "supplies": ["rice", "beans", "oil", "tomatoes", "maggi"],
  "groceries": ["rice", "beans", "tomatoes", "peppers", "onions", "oil", "maggi"],
};

// Market-specific specialties
const MARKET_SPECIALTIES: Record<string, string[]> = {
  "mile 12": ["tomatoes", "peppers", "onions", "beans", "palm oil", "groundnut oil"],
  "balogun": ["clothing", "fabric", "ankara", "shoes", "electronics", "cosmetics"],
  "oshodi": ["rice", "beans", "garri", "yam", "plantain"],
  "alaba": ["electronics", "phone", "clothing", "fabric"],
  "oyingbo": ["tomatoes", "peppers", "onions", "fish", "crayfish"],
  "aspamda": ["rice", "beans", "garri", "palm oil", "groundnut oil"],
  "trade fair": ["electronics", "clothing", "shoes", "fabric"],
  "mile 3": ["tomatoes", "peppers", "yam", "plantain", "palm oil"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function findItemsFromTitle(title: string): MarketItemSuggestion[] {
  const titleLower = title.toLowerCase();
  const suggestions: MarketItemSuggestion[] = [];
  const seen = new Set<string>();

  // Direct keyword matching
  for (const item of Object.keys(MARKET_ITEMS)) {
    if (titleLower.includes(item) && !seen.has(item)) {
      seen.add(item);
      const price = MARKET_ITEMS[item];
      suggestions.push({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        quantity: `1 ${price.unit.replace("per ", "")}`,
        maxBudget: price.typical,
        confidence: 0.95,
        category: "direct_match",
      });
    }
  }

  // Pattern matching
  for (const [pattern, items] of Object.entries(TITLE_PATTERNS)) {
    if (titleLower.includes(pattern)) {
      for (const item of items) {
        if (!seen.has(item) && MARKET_ITEMS[item]) {
          seen.add(item);
          const price = MARKET_ITEMS[item];
          suggestions.push({
            name: item.charAt(0).toUpperCase() + item.slice(1),
            quantity: `1 ${price.unit.replace("per ", "")}`,
            maxBudget: price.typical,
            confidence: 0.75,
            category: "pattern_match",
          });
        }
      }
    }
  }

  return suggestions;
}

function findItemsFromMarket(market: string): MarketItemSuggestion[] {
  const marketLower = market.toLowerCase();
  const suggestions: MarketItemSuggestion[] = [];
  const seen = new Set<string>();

  for (const [keyword, items] of Object.entries(MARKET_SPECIALTIES)) {
    if (marketLower.includes(keyword)) {
      for (const item of items) {
        if (!seen.has(item) && MARKET_ITEMS[item]) {
          seen.add(item);
          const price = MARKET_ITEMS[item];
          suggestions.push({
            name: item.charAt(0).toUpperCase() + item.slice(1),
            quantity: `1 ${price.unit.replace("per ", "")}`,
            maxBudget: price.typical,
            confidence: 0.6,
            category: "market_suggestion",
          });
        }
      }
    }
  }

  return suggestions;
}

// POST /api/ai/suggest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, market, existingItems } = body;

    const titleSuggestions = findItemsFromTitle(title || "");
    const marketSuggestions = findItemsFromMarket(market || "");

    // Merge and deduplicate
    const seen = new Set<string>();
    const existingNames = new Set(
      (existingItems || []).map((item: { name: string }) => item.name.toLowerCase())
    );

    const allSuggestions: MarketItemSuggestion[] = [];

    // Title-based suggestions first (higher confidence)
    for (const s of titleSuggestions) {
      const key = s.name.toLowerCase();
      if (!seen.has(key) && !existingNames.has(key)) {
        seen.add(key);
        allSuggestions.push(s);
      }
    }

    // Market-based suggestions (fill gaps)
    for (const s of marketSuggestions) {
      const key = s.name.toLowerCase();
      if (!seen.has(key) && !existingNames.has(key)) {
        seen.add(key);
        allSuggestions.push(s);
      }
    }

    // Limit to top 10
    const topSuggestions = allSuggestions.slice(0, 10);

    // Calculate estimated total
    const estimatedTotal = topSuggestions.reduce((sum, s) => sum + s.maxBudget, 0);

    return NextResponse.json({
      suggestions: topSuggestions,
      estimatedTotal,
      marketContext: market || null,
      titleContext: title || null,
      message: topSuggestions.length > 0
        ? `Found ${topSuggestions.length} suggested items based on your errand. Prices are estimates from Lagos markets.`
        : "No specific suggestions found. Add your items manually.",
    });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
