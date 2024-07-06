import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { validationResult } from 'express-validator';

export const getInscriptionDetailsByDni = async (dni) => {
  const person = await prisma.person.findUnique({
    where: { dni },
    include: {
      inscriptions: {
        include: {
          principalCareer: {
            include: {
              admissionsTests: {
                include: {
                  admissionTest: true
                }
              }
            }
          },
          secondaryCareer: {
            include: {
              admissionsTests: {
                include: {
                  admissionTest: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!person) {
    throw new Error('Person not found');
  }

  const inscriptionDetails = {
    person: {
      firstName: person.firstName,
      middleName: person.middleName,
      lastName: person.lastName,
      secondLastName: person.secondLastName,
      dni: person.dni,
      email: person.email,
    },
    careers: []
  };

  person.inscriptions.forEach((inscription) => {
    const careers = [
      inscription.principalCareer,
      inscription.secondaryCareer
    ];

    careers.forEach((career) => {
      if (career) {
        const careerDetail = {
          name: career.name,
          tests: career.admissionsTests.map((test) => ({
            name: test.admissionTest.name,
            code: test.admissionTest.code,
            minScore: test.admissionTest.minScoreApprove // Convertir a string
          }))
        };
        inscriptionDetails.careers.push(careerDetail);
      }
    });
  });

  return inscriptionDetails;
};

