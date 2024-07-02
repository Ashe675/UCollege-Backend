import { Request, Response } from "express";
import { Readable } from 'stream';
import csv from 'csv-parser'
import { prisma } from "../../config/db";

type DataCSV = {
    dni: string
    examen: string
    nota: number
}

export class GradeController {
    static readGrades = async (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }

        const expectedHeaders = new Set(['dni', 'examen', 'nota']);
        const results: DataCSV[] = []

        const uniqueRecords = new Set<string>();
        const errors: string[] = [];

        // convirtiendo el csv en un texto
        let csvText = req.file.buffer.toString('utf8')

        // convirtiendo el texto en un objeto Stream
        const readableStream = Readable.from(csvText.split('\n'));

        // Leyendo el texto CSV con limpieza de encabezados y valores
        const parser = csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase()
            ,
            mapValues: ({ value }) => value.trim()
        });

        parser.on('headers', (headers: string[]) => {
            const headersSet = new Set(headers.map(h => h.trim()));
            if (headersSet.size !== expectedHeaders.size || ![...headersSet].every(h => expectedHeaders.has(h))) {
                errors.push(`Encabezados inesperados: se encontró [${headers.join(', ')}], se esperaba [${[...expectedHeaders].join(', ')}]`);
            }
        });

        // leyendo el texto csv
        readableStream
            .pipe(parser)
            .on('data', (data: DataCSV) => {

                if (errors.length > 0) {
                    return;
                }

                // Eliminando espacios en blanco adicionales de cada campo
                const cleanedData: DataCSV = {
                    dni: data.dni.replace(/\s+/g, ''),
                    examen: data.examen.trim(),
                    nota: Number(data.nota)
                };

                // Verificar duplicados
                const uniqueKey = `${cleanedData.dni}-${cleanedData.examen}`;
                if (uniqueRecords.has(uniqueKey)) {
                    // Agregar error si hay duplicados
                    errors.push(`Datos duplicados para DNI: ${cleanedData.dni}, Exam: ${cleanedData.examen}`);
                } else {
                    uniqueRecords.add(uniqueKey);
                    results.push(cleanedData);
                }
            })
            .on('end', async () => {

                if (errors.length > 0) {
                    return res.status(400).json({ errors });
                }

                try {
                    // Procesar resultados o guardar en la base de datos
                    for (const [index, result] of results.entries()) {

                        // validando que la nota sea mayor a cero
                        if (result.nota < 0) {
                            const error = new Error('Nota del examen no vállida, fila: ' + index)
                            return res.status(404).json({ error: error.message })
                        }

                        // validado que el examen existe
                        const admissionTest = await prisma.admissionTest.findFirst({
                            include: {
                                admissionTestCareers: true
                            },
                            where: {
                                OR: [
                                    { code: result.examen.toUpperCase() },
                                    { name: result.examen }
                                ]
                            }
                        })

                        if (!admissionTest) {
                            const error = new Error('Examen de admisión no encontrado, fila: ' + index)
                            return res.status(404).json({ error: error.message })
                        }


                        result.dni = result.dni.replace(/\-/g, '')


                        // validando que la inscripcion existe
                        const inscription = await prisma.inscription.findFirst({
                            where: {
                                person: {
                                    dni: result.dni
                                }
                            }
                        })

                        if (!inscription) {
                            const error = new Error('Inscripción de la persona no encontrada, fila: ' + index)
                            return res.status(404).json({ error: error.message })
                        }

                        // validando que la inscripcion existe
                        const testInscription = prisma.result.findFirst({
                            where: {
                                AND: [
                                    {
                                        inscription: {
                                            person: {
                                                dni: result.dni
                                            }
                                        }
                                    },
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
                        })

                        if (!testInscription) {
                            const error = new Error('La persona no está inscrita en el examen, fila: ' + index)
                            return res.status(404).json({ error: error.message })
                        }

                        // validando si el alumno aprobo o no el examen
                        const { minScore } = await prisma.admissionTest_Career.findFirst({
                            where: {
                                OR: [
                                    { careerId: inscription.principalCareerId },
                                    { careerId: inscription.secondaryCareerId }
                                ],
                                admissionTestId: admissionTest.id
                            },
                            select: {
                                minScore: true
                            }
                        })

                        // actualizando en la bdd
                        await prisma.result.update({
                            where: {
                                inscriptionId_admissionTestId: {
                                    admissionTestId: admissionTest.id,
                                    inscriptionId: inscription.id
                                }
                            },
                            data: {
                                score: Number(result.nota),
                                date: new Date(),
                                message: result.nota >= minScore ? 'APROBADO' : 'REPROBADO'
                            }
                        })

                    }

                    // obteniendo tdas las suscripciones
                    const inscriptions = await prisma.inscription.findMany({
                        include: {
                            results: {
                                select: {
                                    admissionTestId: true,
                                    score: true
                                }
                            }
                        }
                    })

                    // recorriendo todas las inscripciones
                    inscriptions.forEach(async (inscription) => {
                        // 1 : Aprobo Ambos Examenes
                        // 2 : Aprobo carrera principal
                        // 3 : Aprobo carrera secundaria
                        // 4 : no aprobo
                        let opinionId: 1 | 2 | 3 | 4 = 4

                        // buscando el puntaje ncesario de los examenes para la carrera principal
                        const scoresPrincipalCareer = await prisma.admissionTest_Career.findMany({
                            where: {
                                careerId: inscription.principalCareerId
                            },
                            select: {
                                minScore: true,
                                admissionTestId: true
                            }
                        })

                        // buscando el puntaje ncesario de los examenes para la carrera secundaria
                        const scoresSecondaryCareer = await prisma.admissionTest_Career.findMany({
                            where: {
                                careerId: inscription.secondaryCareerId
                            },
                            select: {
                                minScore: true,
                                admissionTestId: true
                            }
                        })

                        let passPrincipalCareer = true
                        let passSecondaryCareer = true

                        // comprobando que el alumno paso la carrera principal
                        for (let i = 0; i < scoresPrincipalCareer.length; i++) {
                            for (let j = 0; j < inscription.results.length; j++) {
                                if (scoresPrincipalCareer[i].admissionTestId === inscription.results[j].admissionTestId) {
                                    inscription.results[j].score < scoresPrincipalCareer[i].minScore ? passPrincipalCareer = false : passPrincipalCareer = true
                                }
                            }
                        }

                        // comprobando que el alumno paso la carrera secundaria
                        for (let i = 0; i < scoresSecondaryCareer.length; i++) {
                            for (let j = 0; j < inscription.results.length; j++) {
                                if (scoresSecondaryCareer[i].admissionTestId === inscription.results[j].admissionTestId) {
                                    inscription.results[j].score < scoresSecondaryCareer[i].minScore ? passSecondaryCareer = false : passSecondaryCareer = true
                                }
                            }
                        }

                        if (passPrincipalCareer && passSecondaryCareer) {
                            opinionId = 1
                        } else if (passPrincipalCareer) {
                            opinionId = 2
                        } else if (passSecondaryCareer) {
                            opinionId = 3
                        }

                        // actualizando en la bdd el dictamen del alumno
                        inscription.results.forEach(async (result) => {
                            await prisma.result.update({
                                where: {
                                    inscriptionId_admissionTestId: {
                                        inscriptionId: inscription.id,
                                        admissionTestId: result.admissionTestId
                                    }
                                },
                                data: {
                                    opinionId
                                }
                            })

                        });

                    })

                    res.status(200).send('CSV data has been processed.');
                } catch (error) {
                    res.status(500).send({ error: error.message });
                }
            });


    }

    static async sendGrade(result, inscription) {
        // verificando si el alumno aprobó los examenes
        let message = ''

        const scorePAA = await prisma.admissionTest.findFirst({
            where: {
                code: 'PAA'
            },
            select: {
                minScoreApprove: true
            }
        })
        if (result.nota >= scorePAA.minScoreApprove) {
            message = 'APROBÓ EL EXAMEN PAA CON EL MÍNIMO PUNTAJE'

            const scoresPrincipalCareer = await prisma.admissionTest_Career.findMany({
                where: {
                    careerId: inscription.principalCareerId
                },
                select: {
                    minScore: true
                }
            })

            const scoresSecondaryCareer = await prisma.admissionTest_Career.findMany({
                where: {
                    careerId: inscription.secondaryCareerId
                },
                select: {
                    minScore: true
                }
            })

            let passPrincipalCareer = false
            let passSecondaryCareer = false



            passPrincipalCareer = scoresPrincipalCareer.every((score) => result.nota > score.minScore)
            if (passPrincipalCareer) message = 'APROBADO PARA LA CARRERA PRINCIPAL'

            passSecondaryCareer = scoresSecondaryCareer.every((score) => result.nota > score.minScore)
            if (passSecondaryCareer) message = 'APROBADO PARA LA CARRERA SECUNDARIA'

            if (passPrincipalCareer && passSecondaryCareer) {
                message = 'APROBADO PARA AMBAS CARRERAS'
            }

        } else {
            message = 'NO APROBÓ EL EXAMEN PAA'
        }
    }

}