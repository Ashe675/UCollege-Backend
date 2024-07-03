import { prisma } from '../../config/db';
import InscriptionValidator from '../../validators/inscription/InscriptionValidator';

export default class InscriptionService {
  async createOrFindPerson(data: {
    dni: string,
    firstName: string,
    middleName?: string,
    lastName: string,
    secondLastName?: string,
    phoneNumber: string,
    email: string,
  }) {
    let person = await prisma.person.findUnique({
      where: { dni: data.dni },
    });

    if (!person) {
      person = await prisma.person.create({
        data: {
          dni: data.dni,
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          secondLastName: data.secondLastName,
          phoneNumber: data.phoneNumber,
          email: data.email,
        },
      });
    }

    return person;
  }

  async validateSpecialTest(personId: number, principalCareerId: number, secondaryCareerId: number) {
    const validateSpecialTest = await InscriptionValidator.isEspecialTest(principalCareerId, secondaryCareerId);
    if (validateSpecialTest) {
      const validation = await InscriptionValidator.counterInscription(personId);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
    }
  }

  async createInscription(personId: number, principalCareerId: number, secondaryCareerId: number, photoCertificate?: string) {
    if (principalCareerId === secondaryCareerId) {
      throw new Error("Las carreras primaria y secundaria son iguales");
    }

    const inscription = await prisma.inscription.create({
      data: {
        principalCareerId,
        secondaryCareerId,
        photoCertificate: photoCertificate || '',
        personId,
      },
    });

    return inscription;
  }

  async createResults(inscriptionId: number, principalCareerId: number, secondaryCareerId: number) {
    const admissionTests = await prisma.admissionTest_Career.findMany({
      where: {
        OR: [
          { careerId: principalCareerId },
          { careerId: secondaryCareerId },
        ],
      },
      include: {
        admissionTest: true,
      },
    });

    for (const test of admissionTests) {
      try {
        await prisma.result.create({
          data: {
            inscriptionId: inscriptionId,
            admissionTestId: test.admissionTestId,
          },
        });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`Duplicate entry for inscriptionId: ${inscriptionId} and admissionTestId: ${test.admissionTestId}`);
        } else {
          throw error;
        }
      }
    }
  }
}
