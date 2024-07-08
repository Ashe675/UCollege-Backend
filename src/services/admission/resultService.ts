import { prisma } from "../../config/db";

export const getInscriptionResultsByDni = async (dni: string, processId: number) => {
  const person = await prisma.person.findUnique({
    where: { dni },
    include: {
      inscriptions: {
        include: {
          principalCareer: true,
          secondaryCareer: true,
          results: {
            where: {
              processId: processId
            },
            include: {
              admissionTest: true
            }
          },
          opinion: true
        }
      }
    }
  });
  

  if (!person) {
    throw new Error('No se encontraron registros');
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
    results: []
  };

  person.inscriptions.forEach((inscription) => {
    if (inscription.results.length > 0) {
      inscription.results.forEach((result) => {
        inscriptionDetails.results.push({
          testName: result.admissionTest.name,
          code: result.admissionTest.code,
          score: result.score,
          message: result.message,
        });
      });

      inscriptionDetails['opinion'] = inscription.opinion ? {
        id: inscription.opinion.id,
        message: inscription.opinion.message,
      } : null;

      if (!inscription.opinion) {
        throw new Error('Resultados no disponibles');
      }

    }
  });
  
  

  if (inscriptionDetails.results.length === 0) {
    throw new Error('No se encontraron los resultados');
  }

  return inscriptionDetails;
};
