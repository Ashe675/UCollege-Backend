import { prisma } from "../../config/db"
import { DataCSV } from "./CSVService";

export class GradeService {
    static validateAndSaveResult = async (result: DataCSV, index: number, processResultId : number) => {
        const nota = parseInt(result.nota);

        if (isNaN(nota) || nota < 0) {
            throw new Error(`Nota del examen no válida, fila: ${index}`);
        }

        // validando que el examen exista
        const admissionTest = await prisma.admissionTest.findFirst({
            include: { admissionTestCareers: true },
            where: {
                OR: [
                    { code: result.examen.toUpperCase() },
                    { name: result.examen }
                ]
            }
        });

        if (!admissionTest) {
            throw new Error(`Examen de admisión no encontrado, fila: ${index + 1}`);
        }

        // validando que la inscripción exista
        const inscription = await prisma.inscription.findFirst({
            where: { person: { dni: result.dni },
            results : {
                every : {
                    processId : processResultId
                }
            }
        }
        });

        if (!inscription) {
            throw new Error(`Inscripción de la persona no encontrada, fila: ${index + 1}`);
        }

        // validando que la persona este inscrita en el examen
        const testInscription = await prisma.result.findFirst({
            where: {
                AND: [
                    { inscription: { person: { dni: result.dni } } },
                    { processId : processResultId },
                    {
                        admissionTest: {
                            OR: [
                                { code: result.examen.toUpperCase() },
                                { name: result.examen }
                            ]
                        }
                    }
                ]
            }
        });

        if (!testInscription) {
            throw new Error(`La persona no está inscrita en el examen, fila: ${index + 1}`);
        }

        const testInscriptionGrade = await prisma.result.findFirst({
            where: {
                AND: [
                    { inscription: { person: { dni: result.dni } } },
                    { processId : processResultId },
                    { score : {
                        not : null
                    }},
                    {
                        admissionTest: {
                            OR: [
                                { code: result.examen.toUpperCase() },
                                { name: result.examen }
                            ]
                        }
                    }
                ]
            }
        });

        if (testInscriptionGrade) {
            throw new Error(`La persona ya tiene una calificación, fila: ${index + 1}`);
        }

        // obteniendo el puntaje mínimo que se necesita para aprobar un examen
        const { minScore, admissionTest: { score: maxScore } } = await prisma.admissionTest_Career.findFirst({
            where: {
                OR: [
                    { careerId: inscription.principalCareerId },
                    { careerId: inscription.secondaryCareerId }
                ],
                admissionTestId: admissionTest.id
            },
            select: { minScore: true, admissionTest: { select: { score: true } } }
        });

        // validando que la nota no se pasa del maximo establecido
        if (nota > maxScore) {
            throw new Error(`La nota no es válida ya que se pasa de su valor máximo (${maxScore}), fila: ${index + 1}`);
        }

        // actualizando el resultado en la bdd
        await prisma.result.update({
            where: {
                inscriptionId_admissionTestId: {
                    admissionTestId: admissionTest.id,
                    inscriptionId: inscription.id
                }
            },
            data: {
                score: nota,
                date: new Date(),
                message: nota >= minScore ? 'APROBADO' : 'REPROBADO'
            }
        });
    }

    static updateInscriptions = async (processResultId : number) => {
        // obteniendo todas las inscripciones
        const inscriptions = await prisma.inscription.findMany({
            where : {
                opinionId : null,
                results : {
                    every : {
                        processId : processResultId
                    }
                }
            },
            include: {
                results: {
                    select: {
                        admissionTestId: true,
                        score: true
                    }
                }
            }
        });

        // recorriendo las inscripciones
        for (const inscription of inscriptions) {
            // 1 - Aprobó todos
            // 2 - Aprobó la principal
            // 3 - Aprobó la secundaria
            // 4 - No Aprobó
            let opinionId: 1 | 2 | 3 | 4 = 4;

            // obteniendo los puntajes necesarios para aproba la carrera principal
            const scoresPrincipalCareer = await prisma.admissionTest_Career.findMany({
                where: { careerId: inscription.principalCareerId },
                select: { minScore: true, admissionTestId: true }
            });

            // obteniendo los puntajes necesarios para aproba la carrera secundaria
            const scoresSecondaryCareer = await prisma.admissionTest_Career.findMany({
                where: { careerId: inscription.secondaryCareerId },
                select: { minScore: true, admissionTestId: true }
            });



            // comparando que los examenes hechos de la carrera principal hayan sido aprobados 
            const passPrincipalCareer = scoresPrincipalCareer.every(score =>
                inscription.results.some(result => result.admissionTestId === score.admissionTestId && result.score >= score.minScore)
            );

            // comparando que los examenes hechos de la carrera secundaria hayan sido aprobados
            const passSecondaryCareer = scoresSecondaryCareer.every(score =>
                inscription.results.some(result => result.admissionTestId === score.admissionTestId && result.score >= score.minScore)
            );

            if (passPrincipalCareer && passSecondaryCareer) {
                opinionId = 1;
            } else if (passPrincipalCareer) {
                opinionId = 2;
            } else if (passSecondaryCareer) {
                opinionId = 3;
            }

            // actualizando la tabla de inscripcion dando un veredicto sobre si aprobó o no 
            await prisma.inscription.update({
                where: {
                    id: inscription.id
                },
                data: { opinionId }
            })

        }
    }

    static async getGrades (processResultId : number) {
        const results = await prisma.inscription.findMany({
            where : {
                opinionId : {
                    not : null
                },
                results : {
                    every : {
                        processId : processResultId
                    }
                },
                notificated : false
            },
            select : {
                id : true,
                person : {
                    select : {
                        email : true,
                        firstName : true,
                        lastName : true
                    }
                },
                opinion : {
                    select : {
                        message : true
                    }
                },
                results : {
                    select : {
                        admissionTest : {
                            select : {
                                name : true,
                                code: true
                            }
                        },
                        message : true,
                        score : true
                    }
                }
            }
        })

        console.log(results)

        if(!results.length){
            throw Error('No hay calificaciones para enviar')
        }

        return results;
    }


}
