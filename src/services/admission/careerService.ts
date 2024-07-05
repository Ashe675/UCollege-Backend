import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllCareers = async () => {
  return await prisma.career.findMany({
    select: {
      id: true,
      name: true,
    },
  });
};

module.exports = {
  getAllCareers,
};

