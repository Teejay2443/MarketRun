const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({ select: { id: true, name: true, email: true } });
  console.log('Users:', JSON.stringify(users, null, 2));
  
  const errands = await p.errand.findMany({ select: { id: true, title: true, status: true, requesterId: true, shopperId: true } });
  console.log('Errands:', JSON.stringify(errands, null, 2));
}

main().then(() => p.$disconnect());
