import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo users
  const password = await bcrypt.hash("password123", 10);

  const adebayo = await prisma.user.upsert({
    where: { email: "adebayo@marketrun.com" },
    update: {},
    create: {
      name: "Adebayo Ogunlesi",
      email: "adebayo@marketrun.com",
      password,
      estate: "Lekki Gardens Phase 3",
      role: "requester",
      rating: 4.9,
    },
  });

  const chioma = await prisma.user.upsert({
    where: { email: "chioma@marketrun.com" },
    update: {},
    create: {
      name: "Chioma Nwosu",
      email: "chioma@marketrun.com",
      password,
      estate: "Opebi Gardens Estate",
      role: "requester",
      rating: 4.7,
    },
  });

  const emeka = await prisma.user.upsert({
    where: { email: "emeka@marketrun.com" },
    update: {},
    create: {
      name: "Emeka Adeyemi",
      email: "emeka@marketrun.com",
      password,
      estate: "Surulere Staff Quarters",
      role: "shopper",
      rating: 5.0,
    },
  });

  const fatima = await prisma.user.upsert({
    where: { email: "fatima@marketrun.com" },
    update: {},
    create: {
      name: "Fatima Bello",
      email: "fatima@marketrun.com",
      password,
      estate: "Allen Gardens",
      role: "requester",
      rating: 4.8,
    },
  });

  const tunde = await prisma.user.upsert({
    where: { email: "tunde@marketrun.com" },
    update: {},
    create: {
      name: "Tunde Bakare",
      email: "tunde@marketrun.com",
      password,
      estate: "V.I. Palm Court",
      role: "shopper",
      rating: 4.6,
    },
  });

  // Create demo errands
  const errands = [
    {
      title: "Fresh tomatoes and peppers for weekend cooking",
      description: "Need fresh produce for a family gathering this weekend. Looking for ripe tomatoes and scotch bonnet peppers.",
      market: "Balogun Market",
      items: JSON.stringify([
        { name: "Tomatoes", quantity: "2kg", brand: "", maxBudget: 3000 },
        { name: "Scotch Bonnet", quantity: "1kg", brand: "", maxBudget: 2500 },
        { name: "Onions", quantity: "1kg", brand: "", maxBudget: 1500 },
      ]),
      budget: 7000,
      reward: 1500,
      status: "OPEN",
      address: "12 Admiralty Way, Lekki Phase 1",
      estate: "Lekki Gardens Phase 3",
      requesterId: adebayo.id,
    },
    {
      title: "Party supplies for birthday celebration",
      description: "Organizing a surprise birthday party for my daughter. Need drinks, snacks, and decorations.",
      market: "Mile 12 Market",
      items: JSON.stringify([
        { name: "Coca-Cola", quantity: "2 packs", brand: "Coca-Cola", maxBudget: 4000 },
        { name: "Chin Chin", quantity: "1kg", brand: "", maxBudget: 2000 },
        { name: "Birthday Hats", quantity: "10 pieces", brand: "", maxBudget: 1500 },
      ]),
      budget: 7500,
      reward: 2000,
      status: "ACCEPTED",
      address: "45 Opebi Road, Ikeja",
      estate: "Opebi Gardens Estate",
      requesterId: chioma.id,
      shopperId: emeka.id,
    },
    {
      title: "Weekly grocery restock",
      description: "Need to stock up on essential food items for the week. Mostly packaged goods.",
      market: "Mile 3 Market",
      items: JSON.stringify([
        { name: "Rice", quantity: "5kg", brand: "Mama Gold", maxBudget: 8000 },
        { name: "Vegetable Oil", quantity: "2 litres", brand: "Kings", maxBudget: 5000 },
        { name: "Garri", quantity: "3kg", brand: "", maxBudget: 3000 },
        { name: "Beans", quantity: "2kg", brand: "", maxBudget: 4000 },
      ]),
      budget: 20000,
      reward: 3000,
      status: "OPEN",
      address: "7B Ogunlana Drive, Surulere",
      estate: "Surulere Staff Quarters",
      requesterId: emeka.id,
    },
    {
      title: "Fresh fish and seafood for dinner",
      description: "Looking for fresh tilapia and shrimp for a special dinner tonight.",
      market: "Balogun Market",
      items: JSON.stringify([
        { name: "Tilapia", quantity: "1kg", brand: "", maxBudget: 4000 },
        { name: "Shrimp", quantity: "500g", brand: "", maxBudget: 6000 },
      ]),
      budget: 10000,
      reward: 1800,
      status: "FUNDED",
      address: "23 Allen Avenue, Ikeja",
      estate: "Allen Gardens",
      requesterId: fatima.id,
      shopperId: tunde.id,
    },
    {
      title: "Baby items and diapers urgently needed",
      description: "Need diapers and baby wipes urgently. Baby is running low.",
      market: "Oshodi Market",
      items: JSON.stringify([
        { name: "Pampers Diapers", quantity: "1 pack (Medium)", brand: "Pampers", maxBudget: 5000 },
        { name: "Baby Wipes", quantity: "3 packs", brand: "Huggies", maxBudget: 2000 },
      ]),
      budget: 7000,
      reward: 1200,
      status: "SHOPPING",
      address: "15 Ogudu Road, Ojota",
      estate: "Ogudu Gardens",
      requesterId: chioma.id,
      shopperId: emeka.id,
    },
    {
      title: "Fresh fruits for the week",
      description: "Need a variety of fresh fruits for healthy snacking throughout the week.",
      market: "Mile 12 Market",
      items: JSON.stringify([
        { name: "Apples", quantity: "1kg", brand: "", maxBudget: 3000 },
        { name: "Bananas", quantity: "1 bunch", brand: "", maxBudget: 1500 },
        { name: "Watermelon", quantity: "1 medium", brand: "", maxBudget: 2000 },
      ]),
      budget: 6500,
      reward: 2000,
      status: "OPEN",
      address: "8 Ozumba Mbadiwe Avenue, Victoria Island",
      estate: "V.I. Palm Court",
      requesterId: fatima.id,
    },
  ];

  for (const errand of errands) {
    await prisma.errand.create({ data: errand });
  }

  console.log("Seeded 5 users and 6 errands");
  console.log("Demo login: adebayo@marketrun.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
