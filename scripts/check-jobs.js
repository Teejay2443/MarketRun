const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const kemiJobs = await p.errand.findMany({
    where: { shopperId: 'cmrrmu2dd0000i4dg18vrksm0' },
    select: { id: true, title: true, status: true, shopperId: true, requesterId: true }
  });
  console.log('Kemi jobs:', JSON.stringify(kemiJobs, null, 2));

  const allAccepted = await p.errand.findMany({
    where: { status: { in: ['ACCEPTED', 'FUNDED', 'SHOPPING', 'DELIVERED'] } },
    select: { id: true, title: true, status: true, shopperId: true }
  });
  console.log('All non-open errands:', JSON.stringify(allAccepted, null, 2));
}

main().then(() => p.$disconnect());
