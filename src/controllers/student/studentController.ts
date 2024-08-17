import { prisma } from "../../config/db"
import { Request, Response } from "express"
import { getStudentGradeInfo } from "../../services/student/getGradeInfo";

export const getGradeStudent = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;
    const sectionId = parseInt(req.params.sectionId);

    try {
        // Devolver la respuesta con la información
        const result = getStudentGradeInfo( sectionId, userStudentId)
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error al obtener la nota del estudiante: ", error);

        return res.status(500).json({
            error: "Error interno del servidor",
            detalles: error.message
        });
    }
};



export const getAllGradeStudent = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;

    try {
        // Obtener todas las inscripciones del estudiante (enrollments)
        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: userStudentId,
                section:{
                    academicPeriod:{
                        process:{
                            active:true
                        }
                    }
                }
             },
            select: { sectionId: true }
        });

        if (enrollments.length === 0) {
            return res.status(404).json({
                error: "No se encontraron inscripciones para el estudiante en este periodo academico"
            });
        }

        // Recorrer todas las inscripciones y obtener la información de cada una
        const gradesInfo = await Promise.all(
            enrollments.map(async (enrollment) => {
                return await getStudentGradeInfo(enrollment.sectionId, userStudentId);
            })
        );

        // Devolver todas las notas
        return res.status(200).json(gradesInfo);

    } catch (error) {
        console.error("Error al obtener todas las notas del estudiante: ", error);

        return res.status(500).json({
            error: "Error interno del servidor",
            detalles: error.message
        });
    }
};