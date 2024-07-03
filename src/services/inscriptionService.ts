import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllInscriptions = async () => {
  return prisma.inscription.findMany({
    include: {
      person: true,
      principalCareer: {
        include: {
          admissionsTests: {
            include: {
              admissionTest: true,
            },
          },
        },
      },
      secondaryCareer: {
        include: {
          admissionsTests: {
            include: {
              admissionTest: true,
            },
          },
        },
      },
    },
  });
};
