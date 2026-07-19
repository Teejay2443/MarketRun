export interface Errand {
  id: string;
  title: string;
  description: string;
  market: string;
  items: { name: string; quantity: string; brand?: string; maxBudget: number }[];
  budget: number;
  reward: number;
  status: "OPEN" | "ACCEPTED" | "FUNDED" | "SHOPPING" | "DELIVERED" | "COMPLETED";
  address: string;
  estate: string;
  requester: {
    name: string;
    estate: string;
    rating: number;
    errandsCompleted: number;
  };
  createdAt: string;
}

export const mockErrands: Errand[] = [
  {
    id: "1",
    title: "Fresh tomatoes and peppers for weekend cooking",
    description: "Need fresh produce for a family gathering this weekend. Looking for ripe tomatoes and scotch bonnet peppers.",
    market: "Balogun Market",
    items: [
      { name: "Tomatoes", quantity: "2kg", maxBudget: 3000 },
      { name: "Scotch Bonnet", quantity: "1kg", maxBudget: 2500 },
      { name: "Onions", quantity: "1kg", maxBudget: 1500 },
    ],
    budget: 7000,
    reward: 1500,
    status: "OPEN",
    address: "12 Admiralty Way, Lekki Phase 1",
    estate: "Lekki Gardens Phase 3",
    requester: {
      name: "Adebayo O.",
      estate: "Lekki Gardens Phase 3",
      rating: 4.9,
      errandsCompleted: 23,
    },
    createdAt: "2026-07-19T08:30:00Z",
  },
  {
    id: "2",
    title: "Party supplies for birthday celebration",
    description: "Organizing a surprise birthday party for my daughter. Need drinks, snacks, and decorations.",
    market: "Mile 12 Market",
    items: [
      { name: "Coca-Cola", quantity: "2 packs", maxBudget: 4000 },
      { name: "Chin Chin", quantity: "1kg", maxBudget: 2000 },
      { name: "Birthday Hats", quantity: "10 pieces", maxBudget: 1500 },
    ],
    budget: 7500,
    reward: 2000,
    status: "ACCEPTED",
    address: "45 Opebi Road, Ikeja",
    estate: "Opebi Gardens Estate",
    requester: {
      name: "Chioma N.",
      estate: "Opebi Gardens Estate",
      rating: 4.7,
      errandsCompleted: 15,
    },
    createdAt: "2026-07-19T07:15:00Z",
  },
  {
    id: "3",
    title: "Weekly grocery restock",
    description: "Need to stock up on essential food items for the week. Mostly packaged goods.",
    market: "Mile 3 Market",
    items: [
      { name: "Rice", quantity: "5kg", maxBudget: 8000 },
      { name: "Vegetable Oil", quantity: "2 litres", maxBudget: 5000 },
      { name: "Garri", quantity: "3kg", maxBudget: 3000 },
      { name: "Beans", quantity: "2kg", maxBudget: 4000 },
    ],
    budget: 20000,
    reward: 3000,
    status: "OPEN",
    address: "7B Ogunlana Drive, Surulere",
    estate: "Surulere Staff Quarters",
    requester: {
      name: "Emeka A.",
      estate: "Surulere Staff Quarters",
      rating: 5.0,
      errandsCompleted: 42,
    },
    createdAt: "2026-07-19T06:45:00Z",
  },
  {
    id: "4",
    title: "Fresh fish and seafood",
    description: "Looking for fresh tilapia and shrimp for a special dinner tonight.",
    market: "Balogun Market",
    items: [
      { name: "Tilapia", quantity: "1kg", maxBudget: 4000 },
      { name: "Shrimp", quantity: "500g", maxBudget: 6000 },
    ],
    budget: 10000,
    reward: 1800,
    status: "FUNDED",
    address: "23 Allen Avenue, Ikeja",
    estate: "Allen Gardens",
    requester: {
      name: "Fatima B.",
      estate: "Allen Gardens",
      rating: 4.8,
      errandsCompleted: 18,
    },
    createdAt: "2026-07-19T05:30:00Z",
  },
  {
    id: "5",
    title: "Baby items and diapers",
    description: "Need diapers and baby wipes urgently. Baby is running low.",
    market: "Oshodi Market",
    items: [
      { name: "Pampers Diapers", quantity: "1 pack (Medium)", maxBudget: 5000 },
      { name: "Baby Wipes", quantity: "3 packs", maxBudget: 2000 },
    ],
    budget: 7000,
    reward: 1200,
    status: "SHOPPING",
    address: "15 Ogudu Road, Ojota",
    estate: "Ogudu Gardens",
    requester: {
      name: "Blessing E.",
      estate: "Ogudu Gardens",
      rating: 4.6,
      errandsCompleted: 8,
    },
    createdAt: "2026-07-19T04:00:00Z",
  },
  {
    id: "6",
    title: "Fresh fruits for the week",
    description: "Need a variety of fresh fruits for healthy snacking throughout the week.",
    market: "Mile 12 Market",
    items: [
      { name: "Apples", quantity: "1kg", maxBudget: 3000 },
      { name: "Bananas", quantity: "1 bunch", maxBudget: 1500 },
      { name: "Watermelon", quantity: "1 medium", maxBudget: 2000 },
      { name: "Grapes", quantity: "500g", maxBudget: 4000 },
    ],
    budget: 10500,
    reward: 2000,
    status: "OPEN",
    address: "8 Ozumba Mbadiwe Avenue, Victoria Island",
    estate: "V.I. Palm Court",
    requester: {
      name: "David K.",
      estate: "V.I. Palm Court",
      rating: 4.9,
      errandsCompleted: 31,
    },
    createdAt: "2026-07-19T03:15:00Z",
  },
];

export const markets = [
  "Balogun Market",
  "Mile 12 Market",
  "Mile 3 Market",
  "Oshodi Market",
  "Aspamda Market",
  "Oyingbo Market",
];

export const statuses = ["OPEN", "ACCEPTED", "FUNDED", "SHOPPING", "DELIVERED", "COMPLETED"];
