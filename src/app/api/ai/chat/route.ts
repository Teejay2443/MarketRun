import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

interface SuggestedItem {
  name: string;
  quantity: string;
  maxBudget: number;
  category: string;
  note: string;
}

const SYSTEM_INSTRUCTION = `You are MarketRun AI, a helpful shopping assistant for Nigerian open-air markets. You help users plan their shopping by suggesting items and providing realistic prices in Nigerian Naira (₦).

RULES:
1. Always respond with valid JSON when suggesting items
2. Prices must be in Nigerian Naira (₦) and realistic for Nigerian markets
3. Suggest common Nigerian market items
4. Include helpful quantities and notes
5. Be conversational and friendly
6. If the user describes an occasion (birthday, party, etc.), suggest appropriate items
7. Consider seasonal availability

RESPONSE FORMAT:
When suggesting items, respond with ONLY this JSON structure (no markdown, no code blocks):
{"message":"Your conversational response here","items":[{"name":"Item Name","quantity":"1 kg","maxBudget":2500,"category":"food","note":"Fresh from farm"}],"totalEstimate":15000,"marketTip":"Tip about where to find these items"}

If you're just chatting (not suggesting items), respond with:
{"message":"Your conversational response here","items":[],"totalEstimate":0,"marketTip":""}

Nigerian Market Prices Reference (approximate):
- Rice (50kg bag): ₦40,000-55,000
- Tomatoes (basket): ₦500-1,500
- Peppers (basket): ₦300-800
- Onions (bag): ₦400-800
- Garri (paint): ₦2,500-4,000
- Beans (paint): ₦4,000-6,000
- Yam (tuber): ₦800-1,500
- Plantain (bunch): ₦500-1,000
- Palm oil (litre): ₦3,000-4,500
- Chicken (per kg): ₦5,000-8,000
- Fish (per kg): ₦2,500-4,000
- Beef (per kg): ₦3,000-5,000
- Goat meat (per kg): ₦5,500-8,000
- Egg (crate): ₦2,500-3,500
- Bread (loaf): ₦600-1,200
- Milk (tin): ₦800-1,500
- Diapers (pack): ₦3,000-5,000
- Soap (bar): ₦300-600
- Detergent (pack): ₦800-1,500
- Water (sachet bag): ₦400-600
- Beer (bottle): ₦500-1,200
- Soft drink (bottle): ₦300-600
- Cooking gas (12kg fill): ₦8,000-12,000`;

function parseAIResponse(rawResponse: string): {
  message: string;
  items: SuggestedItem[];
  totalEstimate: number;
  marketTip: string;
} {
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        message: parsed.message || rawResponse,
        items: parsed.items || [],
        totalEstimate: parsed.totalEstimate || 0,
        marketTip: parsed.marketTip || "",
      };
    }
  } catch {}
  return { message: rawResponse, items: [], totalEstimate: 0, marketTip: "" };
}

// ============================================================
// POST /api/ai/chat
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Try Gemini first
    try {
      const contents = history.map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
        }),
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const parsed = parseAIResponse(data.candidates[0].content.parts[0].text);
        return NextResponse.json({
          response: parsed.message,
          items: parsed.items,
          totalEstimate: parsed.totalEstimate,
          marketTip: parsed.marketTip,
          source: "gemini",
        });
      }

      console.warn("Gemini unavailable, using local fallback:", data.error?.message || "empty response");
    } catch (geminiError) {
      console.warn("Gemini call failed, using local fallback:", geminiError);
    }

    // Fallback to local suggestions
    const fallback = getLocalSuggestions(message);
    return NextResponse.json({ ...fallback, source: "local" });
  } catch (error) {
    console.error("AI chat error:", error);
    const fallback = getLocalSuggestions("shopping");
    return NextResponse.json({ ...fallback, source: "local" });
  }
}

// ============================================================
// LOCAL FALLBACK - Rule-based Nigerian market suggestions
// ============================================================
const LOCAL_MARKET_ITEMS: Record<string, { typical: number; unit: string }> = {
  "tomatoes": { typical: 500, unit: "per basket" },
  "peppers": { typical: 300, unit: "per basket" },
  "onions": { typical: 400, unit: "per bag" },
  "rice": { typical: 45000, unit: "per 50kg bag" },
  "garri": { typical: 3000, unit: "per paint" },
  "beans": { typical: 5000, unit: "per paint" },
  "yam": { typical: 1000, unit: "per tuber" },
  "plantain": { typical: 500, unit: "per bunch" },
  "palm oil": { typical: 3500, unit: "per litre" },
  "groundnut oil": { typical: 5000, unit: "per litre" },
  "chicken": { typical: 6000, unit: "per kg" },
  "fish": { typical: 3000, unit: "per kg" },
  "beef": { typical: 3500, unit: "per kg" },
  "goat meat": { typical: 6000, unit: "per kg" },
  "crayfish": { typical: 2000, unit: "per wrap" },
  "stockfish": { typical: 3500, unit: "per piece" },
  "dried fish": { typical: 3000, unit: "per piece" },
  "egg": { typical: 2500, unit: "per crate" },
  "bread": { typical: 800, unit: "per loaf" },
  "milk": { typical: 1000, unit: "per tin" },
  "diapers": { typical: 3500, unit: "per pack" },
  "soap": { typical: 400, unit: "per bar" },
  "detergent": { typical: 1000, unit: "per pack" },
  "water": { typical: 500, unit: "per sachet bag" },
  "beer": { typical: 800, unit: "per bottle" },
  "soft drink": { typical: 400, unit: "per bottle" },
  "maggi": { typical: 350, unit: "per pack" },
  "salt": { typical: 200, unit: "per pack" },
  "sugar": { typical: 800, unit: "per kg" },
  "spaghetti": { typical: 350, unit: "per pack" },
  "noodles": { typical: 200, unit: "per pack" },
  "cooking gas": { typical: 8000, unit: "per 12kg fill" },
  "tissue": { typical: 500, unit: "per pack" },
  "tomato paste": { typical: 500, unit: "per tin" },
  "carrots": { typical: 300, unit: "per piece" },
  "cucumber": { typical: 300, unit: "per piece" },
  "lettuce": { typical: 200, unit: "per head" },
  "cabbage": { typical: 300, unit: "per head" },
  "clothing": { typical: 8000, unit: "per piece" },
  "fabric": { typical: 5000, unit: "per yard" },
  "ankara": { typical: 3000, unit: "per yard" },
  "shoes": { typical: 6000, unit: "per pair" },
  "electronics": { typical: 25000, unit: "varies" },
  "phone": { typical: 80000, unit: "varies" },
  "medication": { typical: 2000, unit: "varies" },
};

const OCCASION_ITEMS: Record<string, string[]> = {
  "birthday": ["rice", "chicken", "plantain", "beer", "soft drink", "egg", "onions", "tomatoes", "palm oil", "water"],
  "party": ["rice", "chicken", "plantain", "beer", "soft drink", "palm oil", "onions", "tomatoes", "goat meat", "water"],
  "wedding": ["rice", "chicken", "goat meat", "beer", "soft drink", "palm oil", "tomatoes", "onions", "water", "plantain"],
  "christmas": ["rice", "chicken", "goat meat", "beer", "soft drink", "palm oil", "tomatoes", "onions", "plantain", "water"],
  "new year": ["rice", "chicken", "beer", "soft drink", "water", "plantain", "egg", "bread"],
  "naming": ["rice", "chicken", "egg", "beer", "soft drink", "water", "palm oil"],
  "burial": ["rice", "chicken", "goat meat", "beer", "water", "palm oil", "onions"],
  "cooking": ["tomatoes", "peppers", "onions", "palm oil", "maggi", "salt", "crayfish"],
  "soup": ["tomatoes", "peppers", "onions", "crayfish", "stockfish", "dried fish", "palm oil", "maggi"],
  "stew": ["tomatoes", "peppers", "onions", "chicken", "palm oil", "maggi"],
  "jollof": ["rice", "tomatoes", "peppers", "onions", "chicken", "tomato paste"],
  "weekend": ["chicken", "rice", "plantain", "egg", "bread"],
  "baby": ["diapers", "milk", "water", "soap"],
  "grocery": ["rice", "beans", "garri", "tomatoes", "peppers", "onions", "palm oil", "maggi"],
  "food": ["rice", "beans", "tomatoes", "peppers", "onions", "palm oil"],
  "meat": ["beef", "chicken", "goat meat", "fish"],
  "vegetable": ["tomatoes", "peppers", "onions", "lettuce", "cabbage", "carrots"],
};

const MARKET_TIPS: Record<string, string> = {
  "mile 12": "Mile 12 is the cheapest for bulk tomatoes, peppers, and onions in Lagos!",
  "balogun": "Balogun is great for clothing, fabric, and shoes. Always negotiate!",
  "oshodi": "Oshodi has competitive prices for food items. Compare stalls before buying.",
  "alaba": "Alaba is best for electronics and phones. Bring someone tech-savvy!",
  "oyingbo": "Oyingbo has the freshest fish and crayfish in the morning.",
};

function getLocalSuggestions(message: string): {
  response: string;
  items: Array<{ name: string; quantity: string; maxBudget: number; category: string; note: string }>;
  totalEstimate: number;
  marketTip: string;
} {
  const msgLower = message.toLowerCase().trim();

  // ============================================================
  // CONVERSATIONAL RESPONSES - detect casual chat
  // ============================================================
  const casualPatterns = /^(hi|hello|hey|how are you|good morning|good afternoon|good evening|thanks|thank you|ok|okay|yes|no|help|what can you do|who are you|your name)/;
  if (casualPatterns.test(msgLower)) {
    const greetings: Record<string, string> = {
      "hi": "Hi there! 👋 I'm your MarketRun shopping assistant. Tell me what you need to shop for and I'll suggest items with current Nigerian market prices!",
      "hello": "Hello! 👋 I'm here to help you plan your shopping. Just tell me what you need — like \"birthday party items\" or \"weekend cooking\" — and I'll suggest everything with prices!",
      "hey": "Hey! 👋 Ready to help you shop! Tell me what occasion you're shopping for or what items you need.",
      "how are you": "I'm doing great, thanks for asking! 😊 I'm here to help you shop smarter. What do you need to buy today?",
      "good morning": "Good morning! ☀️ Ready to help you plan your market run. What are you shopping for?",
      "good afternoon": "Good afternoon! 🌤️ What can I help you shop for today?",
      "good evening": "Good evening! 🌙 Tell me what you need and I'll get your shopping list ready.",
      "thanks": "You're welcome! Let me know if you need anything else. Happy shopping! 🛒",
      "thank you": "You're welcome! Don't forget to check Mile 12 for the best food prices. Happy shopping! 🛒",
      "ok": "Great! Just tell me what you need to shop for. For example:\n- \"Birthday party for 50 people\"\n- \"Weekend cooking\"\n- \"Baby items\"",
      "okay": "Great! Just tell me what you need to shop for. For example:\n- \"Birthday party for 50 people\"\n- \"Weekend cooking\"\n- \"Baby items\"",
      "yes": "What would you like to shop for? I can suggest items for any occasion!",
      "no": "No problem! Just let me know when you're ready to shop. I'm here to help! 🛒",
      "help": "I can help you plan your shopping! Just tell me:\n\n1. What occasion? (birthday, party, wedding, cooking, etc.)\n2. What items do you need?\n3. Which market are you going to?\n\nI'll suggest items with current prices and a total estimate!",
      "what can you do": "I'm your AI shopping assistant! Here's what I can do:\n\n🛒 Suggest items for any occasion (birthday, party, wedding, etc.)\n💰 Give you current Nigerian market prices\n📊 Calculate total estimates\n📍 Recommend the best markets for your items\n\nJust tell me what you need!",
      "who are you": "I'm MarketRun AI, your personal shopping assistant! I help you plan your shopping with accurate Nigerian market prices. What can I help you find today?",
      "your name": "I'm MarketRun AI! Your friendly neighborhood shopping assistant. 🛒 What do you need to shop for?",
    };

    // Find matching greeting
    let response = "";
    for (const [pattern, reply] of Object.entries(greetings)) {
      if (msgLower.includes(pattern)) {
        response = reply;
        break;
      }
    }

    return {
      response: response || "I'm here to help you shop! Tell me what you need — for example, \"birthday party items\" or \"groceries for the week\".",
      items: [],
      totalEstimate: 0,
      marketTip: "",
    };
  }

  // ============================================================
  // SHOPPING SUGGESTIONS
  // ============================================================
  let matchedItems: string[] = [];
  let occasion = "";

  // Find matching occasion
  for (const [key, items] of Object.entries(OCCASION_ITEMS)) {
    if (msgLower.includes(key)) {
      matchedItems = items;
      occasion = key;
      break;
    }
  }

  // Check for market mentions
  let marketTip = "Tip: Mile 12 Market has the best prices for food items in Lagos!";
  for (const [market, tip] of Object.entries(MARKET_TIPS)) {
    if (msgLower.includes(market)) {
      marketTip = tip;
      break;
    }
  }

  // If no occasion matched, look for individual items
  if (matchedItems.length === 0) {
    for (const itemName of Object.keys(LOCAL_MARKET_ITEMS)) {
      if (msgLower.includes(itemName)) {
        matchedItems.push(itemName);
      }
    }
  }

  // If still nothing matched, return conversational prompt
  if (matchedItems.length === 0) {
    return {
      response: "I'm not sure what you're looking for. Could you tell me more? For example:\n\n- \"Birthday party for my husband\"\n- \"Weekend cooking supplies\"\n- \"I need rice, beans, and tomatoes\"\n- \"What can I get for a naming ceremony?\"",
      items: [],
      totalEstimate: 0,
      marketTip: "",
    };
  }

  const items = matchedItems.slice(0, 10).map((name) => {
    const data = LOCAL_MARKET_ITEMS[name] || { typical: 1000, unit: "piece" };
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: `1 ${data.unit.replace("per ", "")}`,
      maxBudget: data.typical,
      category: "market_item",
      note: `Current market price`,
    };
  });

  const totalEstimate = items.reduce((sum, item) => sum + item.maxBudget, 0);

  let response: string;
  if (occasion) {
    response = `Great choice! Here are items I suggest for a ${occasion}:\n\nI've selected ${items.length} items with an estimated total of ₦${totalEstimate.toLocaleString()}. You can select the ones you need and proceed to post your errand.`;
  } else {
    response = `Here are ${items.length} items I found for you:\n\nEstimated total: ₦${totalEstimate.toLocaleString()}. Select the items you need and continue to post your errand.`;
  }

  return { response, items, totalEstimate, marketTip };
}
