const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'muradimusa014@gmail.com';
  const defaultAdminPass = 'AdminPass123!';

  let user = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (user) {
    if (user.role !== 'admin') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' },
      });
      console.log(`SUCCESS: Existing user ${adminEmail} upgraded to role: 'admin'.`);
    } else {
      console.log(`SUCCESS: User ${adminEmail} is already role: 'admin'.`);
    }
  } else {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultAdminPass, salt);
    user = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: 'admin',
      },
    });
    console.log(`SUCCESS: Admin account created for ${adminEmail} with default password: ${defaultAdminPass}`);
  }
}

main()
  .catch((e) => {
    console.error('SETUP FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
