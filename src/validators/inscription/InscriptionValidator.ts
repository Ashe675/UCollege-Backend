import { prisma } from '../../config/db';

class InscriptionValidator {
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
        
        for (const inscription of inscriptions) {
            for (const result of inscription.results) {
                console.log(result);
                if (result.admissionTest.name === 'PCCNS') {
                    pccnsCount++;
                } else if (result.admissionTest.name === 'PAM') {
                    pamCount++;
                }
            }
        }

        // Verificar si la persona ha excedido los límites permitidos
        if (pccnsCount > 1) {
            return { valid: false, message: 'La prueba PCCNS solo se puede realizar una vez.' };
        }

        if (pamCount > 2) {
            return { valid: false, message: 'La prueba PAM solo se puede realizar dos veces.' };
        }

        return { valid: true };
    }

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
}

export default new InscriptionValidator();
