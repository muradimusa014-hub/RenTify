const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.connect()
  .then(() => console.log('DB OK'))
  .catch((e) => console.log('DB FAIL:', e.message))
  .finally(() => p.disconnect());