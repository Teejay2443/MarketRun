const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'kemi@marketrun.com' },
    update: {},
    create: {
      name: 'Kemi Adebanjo',
      email: 'kemi@marketrun.com',
      password,
      estate: 'Lekki Gardens Phase 3',
      role: 'shopper',
      rating: 4.7,
    },
  });
  
  console.log('Created:', user.email, user.name, 'ID:', user.id);
}

main().then(() => prisma.$disconnect());
