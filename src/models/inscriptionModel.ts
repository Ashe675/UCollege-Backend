import { prisma } from '../config/db';


class InscriptionModel {
  async createInscription(data: {
    principalCareerId: number;
    secondaryCareerId: number;
    photoCertificate: string;
    personId: number;
  }) {
    return prisma.inscription.create({
      data,
    });
  }

  async findPersonById(personId: number) {
    return prisma.person.findUnique({
      where: { id: personId },
    });
  }

  async findAdmissionTests(careerIds: number[]) {
    return prisma.admissionTest_Career.findMany({
      where: {
        OR: careerIds.map((id) => ({ careerId: id })),
      },
      include: {
        admissionTest: true,
      },
    });
  }

  async createResult(data: { inscriptionId: number; admissionTestId: number }) {
    return prisma.result.create({
      data,
    });
  }

  async getPersonIdByDni(dni: string): Promise<number | null> {
    try {
      const person = await prisma.person.findUnique({
        where: { dni: dni },
        select: { id: true },
      });
  
      if (person) {
        return person.id;
      } else {
        console.log('Person not found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching person by DNI:', error);
      return null;
    }
  }
}

export default new InscriptionModel();
