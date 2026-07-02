const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Delete all existing data to prevent duplicate seed issues
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  // Create hash passwords
  const passwordHash = await bcrypt.hash('password', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
    },
  });

  const landlord = await prisma.user.create({
    data: {
      email: 'landlord@test.com',
      passwordHash,
      role: 'landlord',
    },
  });

  const tenant = await prisma.user.create({
    data: {
      email: 'tenant@test.com',
      passwordHash,
      role: 'tenant',
    },
  });

  console.log('Users created:', {
    admin: admin.email,
    landlord: landlord.email,
    tenant: tenant.email,
  });

  // 2. Create Properties
  const prop1 = await prisma.property.create({
    data: {
      title: 'Charming 2-Bedroom Flat near ABU Main Gate',
      description: 'A clean, spacious 2-bedroom flat with reliable power and water supply. Located just 5 minutes walk from Ahmadu Bello University (ABU) Samaru main campus gate. Perfect for students and staff.',
      price: 180000,
      location: 'Samaru',
      images: '/uploads/properties/zaria_apartment_1.png',
      status: 'available',
      ownerId: landlord.id,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      title: 'Newly Renovated Self-Contain Apartment',
      description: 'Modern self-contain apartment with tiled floors, modern bathroom, and secure fencing. Located in the quiet, residential area of Sabon Gari.',
      price: 120000,
      location: 'Sabon Gari',
      images: '/uploads/properties/zaria_apartment_2.png',
      status: 'available',
      ownerId: landlord.id,
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      title: 'Premium 4-Bedroom Duplex in GRA Zaria',
      description: 'Luxurious 4-bedroom duplex with security gatehouse, compound space, and modern kitchen. Located in the highly secured Government Reservation Area (GRA) of Zaria.',
      price: 1500000,
      location: 'GRA',
      images: '/uploads/properties/zaria_apartment_1.png,/uploads/properties/zaria_apartment_2.png',
      status: 'available',
      ownerId: landlord.id,
    },
  });

  console.log('Properties created.');

  // 3. Create a Booking Request to kickstart the system demo
  const booking = await prisma.booking.create({
    data: {
      propertyId: prop2.id,
      tenantId: tenant.id,
      status: 'requested',
    },
  });

  console.log('Sample booking created:', booking.id);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
