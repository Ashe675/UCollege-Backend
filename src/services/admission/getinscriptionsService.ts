import { prisma } from "../../config/db";


export const getInscriptionDetailsByDni = async (dni: string, processInscriptionId: number) => {
  const person = await prisma.person.findUnique({
    where: {
      dni
    },
    include: {
      inscriptions: {
        where: {
          processId: processInscriptionId
        },
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
    throw new Error('No se encontraron registros con ese DNI');
  }

  if (person.inscriptions.length === 0) {
    throw new Error('No se encontraron registros con ese DNI');
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
            minScore: test.minScore
          }))
        };
        inscriptionDetails.careers.push(careerDetail);
      }
    });
  });

  return inscriptionDetails;
};

