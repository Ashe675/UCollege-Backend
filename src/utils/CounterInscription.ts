import { prisma } from '../config/db';


export async function counterInscription(personId: number) {
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
    //console.log(pccnsCount);

    // Verificar si la persona ha excedido los límites permitidos
    if (pccnsCount > 1) {
        return { valid: false, message: 'La prueba PCCNS solo se puede realizar una vez.' };
    }

    if (pamCount > 2) {
        return { valid: false, message: 'La prueba PAM solo se puede realizar dos veces.' };
    }

    return { valid: true };
}