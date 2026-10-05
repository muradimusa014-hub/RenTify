const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectProperties() {
  const props = await prisma.property.findMany({
    include: { owner: { select: { email: true } } }
  });
  console.log('Total properties in DB:', props.length);
  for (const pr of props) {
    const imgList = pr.images ? pr.images.split(',') : [];
    console.log({
      id: pr.id,
      title: pr.title,
      status: pr.status,
      isSuspicious: pr.isSuspicious,
      location: pr.location,
      price: pr.price,
      owner: pr.owner?.email,
      imagesCount: imgList.length,
      imageLengths: imgList.map(img => img.length),
      sampleImages: imgList.map(img => img.slice(0, 80))
    });
  }
  await prisma.$disconnect();
}

inspectProperties().catch(console.error);
