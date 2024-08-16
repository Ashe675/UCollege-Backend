import { Request, Response } from "express";
import { prisma } from "../../config/db";

export const submitGradesController = async (req: Request, res: Response) => {
    const { id: idUser } = req.user;
    const { identificationCode, sectionId, grade, obs } = req.body;

    try {
        // Obtener la sección del docente
        const section = await prisma.section.findFirst({
            where: {
                id: sectionId,
                teacherId: idUser,
                active: true,
            },
            include: {
                teacher: true,
                class: true,
                enrollments: true,
            }
        });

        if (!section) {
            return res.status(404).json({ error: 'La sección no existe' });
        }

        // Obtener el ID del estudiante usando su identificationCode
        const user = await prisma.user.findUnique({
            where: { identificationCode: identificationCode },
            include: { student: true }
        });

        if (!user || !user.student) {
            return res.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        const studentId = user.student.id;

        // Validar la observación en función de la nota
        if (grade >= 65 && obs !== 'APR') {
            return res.status(409).json({ error: 'La observación no corresponde a la nota indicada.' });
        }

        if (grade > 0 && grade < 65 && obs !== 'REP' && obs !== 'ABD') {
            return res.status(409).json({ error: 'La observación no corresponde a la nota indicada.' });
        }

        if (grade === 0 && obs !== 'NSP') {
            return res.status(409).json({ error: 'La observación no corresponde a la nota indicada.' });
        }

        // Actualizar la calificación y la observación del estudiante
        await prisma.enrollment.update({
            where: {
                sectionId_studentId: {
                    sectionId: section.id,
                    studentId: studentId
                }
            },
            data: {
                grade: grade,
                OBS: obs
            }
        });

        // Calcular el nuevo índice global del estudiante
        const studentClasses = await prisma.enrollment.findMany({
            where: { studentId: studentId, grade: { not: null } },
            include: {
                section: { include: { class: true } }
            }
        });

        // Si el estudiante no tiene más clases, no calcular el índice global
        if (studentClasses.length > 0) {
            let totalUV = 0;
            let total = 0;

            studentClasses.forEach(clase => {
                if (clase.grade !== 0 && clase.grade !== null) { // Solo considerar las clases donde tiene una calificación
                    totalUV += clase.section.class.UV;
                    total += clase.grade * clase.section.class.UV;
                }
            });

            if (totalUV > 0) {
                const globalGrade = Math.round(total / totalUV);

                // Actualizar el índice global del estudiante
                await prisma.student.update({
                    where: {
                        id: studentId
                    },
                    data: {
                        globalAverage: globalGrade
                    }
                });
            }

        }

        return res.status(200).send('Calificación actualizada exitosamente.');
    } catch (error) {
        console.error('Error al enviar las calificaciones:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
