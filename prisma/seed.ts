import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.errand.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const password = await bcrypt.hash("password123", 10);

  // === DEMO ACCOUNT 1: Adebayo (Requester) ===
  const adebayo = await prisma.user.create({
    data: {
      name: "Adebayo Ogunlesi",
      email: "adebayo@marketrun.com",
      password,
      estate: "Lekki Gardens Phase 3",
      role: "requester",
      rating: 4.9,
      walletBalance: 0,
      totalEarned: 0,
    },
  });

  // === DEMO ACCOUNT 2: Kemi (Shopper) ===
  const kemi = await prisma.user.create({
    data: {
      name: "Kemi Adebanjo",
      email: "kemi@marketrun.com",
      password,
      estate: "Lekki Gardens Phase 3",
      role: "shopper",
      rating: 4.8,
      walletBalance: 12500,
      totalEarned: 45000,
    },
  });

  // === Other demo users for realism ===
  const chioma = await prisma.user.create({
    data: {
      name: "Chioma Nwosu",
      email: "chioma@marketrun.com",
      password,
      estate: "Opebi Gardens Estate",
      role: "requester",
      rating: 4.7,
      walletBalance: 0,
      totalEarned: 0,
    },
  });

  const emeka = await prisma.user.create({
    data: {
      name: "Emeka Adeyemi",
      email: "emeka@marketrun.com",
      password,
      estate: "Surulere Staff Quarters",
      role: "shopper",
      rating: 5.0,
      walletBalance: 8200,
      totalEarned: 67000,
    },
  });

  // ============================================================
  // ERRANDS — Match demo script exactly
  // ============================================================

  // === ERRAND 1: Adebayo's errand (OPEN) — The main demo errand ===
  // This is the errand Kemi will find, accept, and complete in the demo
  const adebayoErrand = await prisma.errand.create({
    data: {
      title: "Fresh tomatoes and peppers for weekend cooking",
      description: "Need ripe tomatoes, scotch bonnet peppers, and onions for jollof rice this weekend. Please get the freshest ones available.",
      market: "Balogun Market",
      items: JSON.stringify([
        { name: "Tomatoes", quantity: "2kg", brand: "", maxBudget: 3500 },
        { name: "Scotch Bonnet Peppers", quantity: "1kg", brand: "", maxBudget: 2000 },
        { name: "Onions", quantity: "3 pieces", brand: "", maxBudget: 1200 },
      ]),
      budget: 6700,
      reward: 1500,
      status: "OPEN",
      address: "12 Admiralty Way, Lekki Phase 1",
      estate: "Lekki Gardens Phase 3",
      requesterId: adebayo.id,
      paymentRef: `MRN-${Date.now()}-DEMO`,
    },
  });

  // === ERRAND 2: Chioma's errand (ACCEPTED) — Shows mid-process errand ===
  const chiomaErrand = await prisma.errand.create({
    data: {
      title: "Party supplies for birthday celebration",
      description: "Organizing a surprise birthday party for my daughter. Need drinks and snacks.",
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
  });

  // === ERRAND 3: Emeka's errand (OPEN) — Another open errand for browsing ===
  await prisma.errand.create({
    data: {
      title: "Weekly grocery restock",
      description: "Need to stock up on essential food items for the week.",
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
  });

  // === ERRAND 4: Shopping in progress errand ===
  await prisma.errand.create({
    data: {
      title: "Baby items urgently needed",
      description: "Need diapers and baby wipes urgently.",
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
  });

  // === ERRAND 5: Completed errand — Shows Kemi's track record ===
  const completedErrand = await prisma.errand.create({
    data: {
      title: "Fresh fish and seafood for dinner",
      description: "Looking for fresh tilapia and shrimp for a special dinner.",
      market: "Balogun Market",
      items: JSON.stringify([
        { name: "Tilapia", quantity: "1kg", brand: "", maxBudget: 4000 },
        { name: "Shrimp", quantity: "500g", brand: "", maxBudget: 6000 },
      ]),
      budget: 10000,
      reward: 1800,
      status: "COMPLETED",
      address: "23 Allen Avenue, Ikeja",
      estate: "Allen Gardens",
      requesterId: chioma.id,
      shopperId: kemi.id,
      paymentRef: `MRN-${Date.now() - 86400000}-PAST`,
      paymentStatus: "PAID",
    },
  });

  // Create transaction for completed errand
  await prisma.transaction.create({
    data: {
      errandId: completedErrand.id,
      amount: 10000 + 1800,
      platformFee: 180,
      shopperPayout: 1620,
      monnifyRef: completedErrand.paymentRef,
      status: "PAID",
    },
  });

  // Create review for completed errand
  await prisma.review.create({
    data: {
      errandId: completedErrand.id,
      reviewerId: chioma.id,
      revieweeId: kemi.id,
      rating: 5,
      comment: "Kemi was amazing! Fresh items, delivered on time. Highly recommend!",
    },
  });

  // === ERRAND 6: Another open errand ===
  await prisma.errand.create({
    data: {
      title: "Fresh fruits for the week",
      description: "Need a variety of fresh fruits for healthy snacking.",
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
      requesterId: chioma.id,
    },
  });

  // Create some messages for the chioma/errand (accepted errand has chat)
  await prisma.message.create({
    data: {
      errandId: chiomaErrand.id,
      senderId: emeka.id,
      content: "Hi Chioma! I'll be heading to Mile 12 Market tomorrow morning. Will get everything on your list.",
    },
  });

  await prisma.message.create({
    data: {
      errandId: chiomaErrand.id,
      senderId: chioma.id,
      content: "Thank you Emeka! Please make sure the Coca-Cola is cold if possible.",
    },
  });

  await prisma.message.create({
    data: {
      errandId: chiomaErrand.id,
      senderId: emeka.id,
      content: "Will do! I'll start shopping early to get the best items.",
    },
  });

  // Create audit logs for demo
  await prisma.auditLog.create({
    data: {
      action: "ERRAND_CREATED",
      entityType: "ERRAND",
      entityId: adebayoErrand.id,
      userId: adebayo.id,
      details: JSON.stringify({ title: adebayoErrand.title, market: adebayoErrand.market }),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "ERRAND_UPDATED",
      entityType: "ERRAND",
      entityId: chiomaErrand.id,
      userId: emeka.id,
      details: JSON.stringify({ status: "ACCEPTED" }),
    },
  });

  console.log("\n=== DEMO ACCOUNTS ===");
  console.log("Requester: adebayo@marketrun.com / password123");
  console.log("Shopper:   kemi@marketrun.com / password123");
  console.log("\n=== ERRANDS ===");
  console.log("1. Adebayo's errand (OPEN) - Balogun Market - Tomatoes, Peppers, Onions");
  console.log("2. Chioma's errand (ACCEPTED) - Mile 12 - Party supplies");
  console.log("3. Emeka's errand (OPEN) - Mile 3 - Weekly groceries");
  console.log("4. Baby items (SHOPPING) - Oshodi");
  console.log("5. Seafood dinner (COMPLETED) - Balogun - Kemi's past job");
  console.log("6. Fresh fruits (OPEN) - Mile 12");
  console.log("\nSeeded 6 users, 6 errands, 3 messages, 1 review, 1 transaction, 2 audit logs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
