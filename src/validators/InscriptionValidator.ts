import { prisma } from '../config/db';
import deleteImage from '../utils/fileHandler'
import { Request, Response, NextFunction } from 'express';


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


    async getProcessIdInscription(req: Request) {
        try {
            const currentDate = new Date();
      
            const activeProcess = await prisma.process.findFirst({
              where: {
                active: true,
                processTypeId: 1,
                startDate: {
                  lte: currentDate, // startDate less than or equal to currentDate
                },
                finalDate: {
                  gte: currentDate, // finalDate greater than or equal to currentDate
                },
              },
              select: {
                id: true,
              },
            });

            if(activeProcess == null){
                const photoCertificate = req.file?.path;
    
                deleteImage(photoCertificate)
            }
      
            return activeProcess ? activeProcess.id : null;
          } catch (error) {

            const photoCertificate = req.file?.path;
    
            deleteImage(photoCertificate)
            console.error('Error buscando el proceso activo:', error);
            return null;
          }
    }
    

    async isActiveProcess(processId: number) {
        try {
            const existingProcess = await prisma.process.findFirst({
                where: {
                    id: processId
                },
            });
    
            // Verifica si el proceso existe y está activo
            if (!existingProcess || !existingProcess.active) {
                return false;
            }
    
            return true;
    
        } catch (error) {
            console.error(error);
            return false; 
        }
    }

}

export default new InscriptionValidator();
