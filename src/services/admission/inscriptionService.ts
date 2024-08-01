import { prisma } from "../../config/db";

export const getAllInscriptions = async (processResultId : number) => {
  return await prisma.inscription.findMany({
    where: {
      opinionId : null,
      results: {
        every : {
          processId : processResultId
        }
      }
    },
    include: {
      person: {
        select: {
          dni: true,
          firstName: true,
          middleName: true,
          lastName: true,
          secondLastName: true,
          email: true,
        }
      },
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

export const getInscriptionDetailsByDni = async (dni) => {
  return await prisma.person.findUnique({
    where: { dni },
    include: {
      inscriptions: {
        include: {
          principalCareer: true,
          secondaryCareer: true,
          results: {
            include: {
              admissionTest: true,
            },
          },
        },
      },
    },
  });
};
