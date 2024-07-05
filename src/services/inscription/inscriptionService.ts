import { prisma } from '../../config/db';
import InscriptionValidator from '../../validators/InscriptionValidator';

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
      if(!InscriptionValidator.validateUniquePerson(data.dni, data.email)){
        throw new Error('email o dni de la persona ya fue registrado al sistema, verifique si esta correcto');
      }else{
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
    }

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

  /**
   * Busca las pruebas de admisión asociadas con las carreras principal y secundaria.
   * Crea resultados para cada prueba de admisión encontrada.
   * Maneja errores de duplicación de entradas y otros errores.
   * 
   * @param inscriptionId - ID de la inscripción.
   * @param principalCareerId - ID de la carrera principal.
   * @param secondaryCareerId - ID de la carrera secundaria.
   */
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
