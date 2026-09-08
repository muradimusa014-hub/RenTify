const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany()
  .then(() => console.log('DB OK'))
  .catch((e) => console.log('DB FAIL:', e.message))
  .finally(() => p.$disconnect());
