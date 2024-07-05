import { prisma } from '../config/db';


/**
 * Clase `InscriptionValidator` para validar inscripciones y personas.
 * 
 * Esta clase proporciona métodos para contar inscripciones, verificar pruebas especiales y validar la unicidad de una persona.
 */
class InscriptionValidator {

    /**
     * Cuenta las inscripciones de una persona y verifica si ha excedido los límites permitidos para ciertas pruebas.
     * 
     * @param personId - ID de la persona.
     * @returns Un objeto con una propiedad `valid` que indica si la validación fue exitosa, y una propiedad `message` con el mensaje de error si la validación falla.
     */
    async counterInscription(personId: number) {
        // Obtener todas las inscripciones de la persona
        const inscriptions = await prisma.inscription.findMany({
            where: { personId },
            include: {
                results: {
                    include: {
                        admissionTest: true,
                    },
                },
            },
        });

        

        
        let pccnsCount = 0;
        let pamCount = 0;
        let paaCount = 0;
        
        for (const inscription of inscriptions) {
            for (const result of inscription.results) {
                //console.log(result);
                if (result.admissionTest.code === 'PCCNS') {
                    pccnsCount++;
                } else if (result.admissionTest.code === 'PAM') {
                    pamCount++;
                } else if (result.admissionTest.code === 'PAA') {
                    paaCount++;
                }
            }
        }
        //console.log(pccnsCount);

        // Verificar si la persona ha excedido los límites permitidos
        if (paaCount >= 3) {
            return { valid: false, message: 'La prueba PAA solo se puede realizar tre veces.' };
        }

        if (pamCount >= 2) {
            return { valid: false, message: 'La prueba PAM solo se puede realizar dos veces.' };
        }

        if (pccnsCount >= 1) {
            return { valid: false, message: 'La prueba PCCNS solo se puede realizar una vez.' };
        }


        return { valid: true };
    }

    /**
     * Verifica si la combinación de carreras principal y secundaria corresponde a una prueba especial.
     * 
     * @param careerId1 - ID de la primera carrera.
     * @param careerId2 - ID de la segunda carrera.
     * @returns Una promesa que resuelve a `true` si es una prueba especial, de lo contrario, resuelve a `false`.
    async isEspecialTest(careerId1: number, careerId2: number): Promise<boolean>{
        try {
            // Obtener las pruebas de admisión asociadas a las carreras
            const testsCareer1 = await prisma.admissionTest_Career.findMany({
              where: { careerId: careerId1 },
              include: { admissionTest: true }
            });
        
            const testsCareer2 = await prisma.admissionTest_Career.findMany({
              where: { careerId: careerId2 },
              include: { admissionTest: true }
            });
            
            // Combinar las pruebas de ambas carreras
            const allTests = [...testsCareer1, ...testsCareer2];
            
            // Verificar si alguna de las pruebas es "PAM" o "PCCNS"
            for (const test of allTests) {
                if (test.admissionTest.code === 'PAM' || test.admissionTest.code === 'PCCNS') {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error al verificar las pruebas especiales:', error);
            return false;
        }
    }
    */
    
    /**
     * Valida si una persona con el DNI o correo electrónico proporcionado ya existe en la base de datos.
     * 
     * @param dni - DNI de la persona.
     * @param email - Correo electrónico de la persona.
     * @returns Una promesa que resuelve a `true` si la persona ya existe, de lo contrario, resuelve a `false`.
     */
    async validateUniquePerson(dni, email) {
        //const { dni, email } = req.body;
        
        try {
          const existingPerson = await prisma.person.findFirst({
            where: {
              OR: [
                { dni },
                { email },
              ],
            },
          });
          console.log(existingPerson);
          
          if (!existingPerson) {
            return false;
          }

          return true;
        } catch (error) {
            console.error(error);
            return false
          
        }
      }

}

export default new InscriptionValidator();
