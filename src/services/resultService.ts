import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getResultsByDate = async (date: string) => {
  return prisma.result.findMany({
    where: {
      date: new Date(date),
    },
    include: {
      inscription: {
        include: {
          person: true,
          principalCareer: true,
          secondaryCareer: true,
        },
      },
      admissionTest: true,
    },
  });
};
