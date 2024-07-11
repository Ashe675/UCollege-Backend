import { prisma } from '../../config/db';
import InscriptionValidator from '../../validators/admission/InscriptionValidator';
import { createObjectCsvStringifier } from 'csv-writer';

/**
 * Servicio para manejar las operaciones relacionadas con las inscripciones.
 * 
 * La clase `InscriptionService` proporciona métodos para crear o encontrar personas, validar pruebas especiales,
 * crear inscripciones y crear resultados de inscripciones.
 * 
 * Métodos:
 * 
 * - `async createOrFindPerson(data: { dni: string, firstName: string, middleName?: string, lastName: string, secondLastName?: string, phoneNumber: string, email: string })`:
 *   - Busca una persona en la base de datos por su DNI.
 *   - Si la persona no existe, verifica si el DNI o el correo electrónico ya están registrados.
 *   - Si no están registrados, crea una nueva persona con los datos proporcionados.
 *   - Devuelve la persona encontrada o creada.
 * 
 * - `async validateSpecialTest(personId: number, principalCareerId: number, secondaryCareerId: number)`:
 *   - Verifica si la combinación de carreras principal y secundaria corresponde a una prueba especial.
 *   - Devuelve `true` si es una prueba especial, de lo contrario, devuelve `false`.
 * 
 * - `async createInscription(personId: number, principalCareerId: number, secondaryCareerId: number, photoCertificate?: string)`:
 *   - Crea una nueva inscripción para una persona con las carreras principal y secundaria especificadas.
 *   - Lanza un error si las carreras principal y secundaria son iguales.
 *   - Devuelve la inscripción creada.
 * 
 * - `async createResults(inscriptionId: number, principalCareerId: number, secondaryCareerId: number)`:
 *   - Busca las pruebas de admisión asociadas con las carreras principal y secundaria.
 *   - Crea resultados para cada prueba de admisión encontrada.
 *   - Maneja errores de duplicación de entradas y otros errores.
 */
export default class InscriptionService {

  /**
   * Busca una persona en la base de datos por su DNI.
   * Si la persona no existe, verifica si el DNI o el correo electrónico ya están registrados.
   * Si no están registrados, crea una nueva persona con los datos proporcionados.
   * Devuelve la persona encontrada o creada.
   * 
   * @param data - Objeto que contiene los datos de la persona:
   *   - dni: string
   *   - firstName: string
   *   - middleName?: string
   *   - lastName: string
   *   - secondLastName?: string
   *   - phoneNumber: string
   *   - email: string
   */
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
        const existingPersonByEmail = await prisma.person.findUnique({
          where: { email: data.email },
        });
  
        if (existingPersonByEmail) {
          throw new Error('El email ya está registrado en el sistema, verifique si es correcto.');
        }
  
        person = await prisma.person.create({
          data: {
            dni: data.dni,
            firstName: data.firstName,
            middleName: data.middleName ? data.middleName : null,
            lastName: data.lastName,
            secondLastName: data.secondLastName ? data.secondLastName : null,
            phoneNumber: data.phoneNumber,
            email: data.email,
          },
        });
      }

      /**
       * aqui falta la logica para asegurarse de que el dni 
       * sea de la persona que se esta registrando.
       * 
       */

      return person;
    }
 


  /**
   * Crea una nueva inscripción para una persona con las carreras principal y secundaria especificadas.
   * Lanza un error si las carreras principal y secundaria son iguales.
   * Devuelve la inscripción creada.
   * 
   * @param personId - ID de la persona.
   * @param principalCareerId - ID de la carrera principal.
   * @param secondaryCareerId - ID de la carrera secundaria.
   * @param photoCertificate - (Opcional) Ruta del certificado de foto.
   */
  async createInscription(personId: number, principalCareerId: number, secondaryCareerId: number, processId: number, regionalCenterId: number , photoCertificate?: string) {
    

    const inscription = await prisma.inscription.create({
      data: {
        
        principalCareerId,
        secondaryCareerId,
        photoCertificate: photoCertificate || '',
        personId,
        processId,
        regionalCenterId,
      },
    });

    return inscription;
  }

  /**
   * Busca las pruebas de admisión asociadas con las carreras principal y secundaria.
   * Crea resultados para cada prueba de admisión encontrada.
   * Maneja errores de duplicación de entradas y otros errores.
   * 
   * @param inscriptionId - ID de la inscripción.
   * @param principalCareerId - ID de la carrera principal.
   * @param secondaryCareerId - ID de la carrera secundaria.
   */
  async createResults(inscriptionId: number, principalCareerId: number, secondaryCareerId: number, processInscriptionId : number) {
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

    const processId = await this.getIdResultProcessActive(processInscriptionId);

    for (const test of admissionTests) {
      try {
        await prisma.result.create({
          data: {
            inscriptionId: inscriptionId,
            admissionTestId: test.admissionTestId,
            processId:  processId,
          },
        });
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`Entrada duplicada para inscriptionId: ${inscriptionId} y admissionTestId: ${test.admissionTestId}`);
        } else {
          throw error;
        }
      }
    }
  }

  
  async validateProcessIdUnique(personId: number, processId: number): Promise<boolean> {
    try {
        const existingInscription = await prisma.inscription.findFirst({
            where: {
                personId,
                processId
            },
        });

        return !!existingInscription; // Devuelve true si existe, false si no existe
    } catch (error) {
        console.error('Error al validar proceso único:', error);
        return false;
    }
  }

  async getIdResultProcessActive(inscriptionId : number): Promise<number | null> {
    try {
      // const currentDate = new Date();

      const activeProcess = await prisma.process.findFirst({
        where: {
          processId : inscriptionId,
          // active: true,
          // startDate: { lte: currentDate }, // startDate less than or equal to currentDate
          // finalDate: { gte: currentDate }, // finalDate greater than or equal to currentDate
          processTypeId: 2,
        },
        select: {
          id: true,
        },
      });

      return activeProcess ? activeProcess.id : null;
    } catch (error) {
      console.error('Error buscando el proceso activo:', error);
      return null;
    }
  }

  static async getApprovedCSVService(): Promise<string> {
    const approvedCandidates = await prisma.inscription.findMany({
      where: {
        opinionId: {
          in: [1, 2, 3], // Los IDs de las opiniones que representan aprobación
        },
      },
      include: {
        person: true, // Incluye la información de la persona
        principalCareer: true, // Incluye la información de la carrera principal
        secondaryCareer: true, // Incluye la información de la carrera secundaria
        results: true, // Incluye los resultados de las pruebas
        opinion: true, // Incluye la opinión para mayor detalle
        regionalCenter: {
          include: {
            town: {
              include: {
                countryDepartment: true,
              },
            },
          },
        },
      },
    });

    if (approvedCandidates.length === 0) {
      throw new Error('Ningún estudiante aprobó las pruebas.');
    }

    // Configuración del CSV
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'dni', title: 'DNI' },
        { id: 'fullName', title: 'Nombre Completo' },
        { id: 'email', title: 'Correo Electrónico' },
        { id: 'career', title: 'Carrera' },
        { id: 'regionalCenter', title: 'Centro Regional' },
      ],
    });

    // Formateo de los datos para el CSV
    const records = approvedCandidates.map(candidate => ({
      dni: candidate.person.dni,
      fullName: `${candidate.person.firstName} ${candidate.person.middleName ?? ''} ${candidate.person.lastName} ${candidate.person.secondLastName ?? ''}`.trim(),
      email: candidate.person.email,
      career: candidate.opinionId === 3 ? candidate.secondaryCareer?.name : candidate.principalCareer.name,
      regionalCenter: `${candidate.regionalCenter.name}, ${candidate.regionalCenter.town.name}, ${candidate.regionalCenter.town.countryDepartment.name}`,
    }));

    // Generación del CSV
    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    return csv;
  }

}
