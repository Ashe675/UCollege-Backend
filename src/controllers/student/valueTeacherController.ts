import { prisma } from "../../config/db"
import { Request, Response } from "express"

export const setGradeTeacher = async(req: Request, res: Response) => {
    const { id: userStudentId } = req.user;
    const { grade: gradeTeacher, sectionId } = req.body;

    // Validar que los datos requeridos estén presentes
    if (!gradeTeacher || !sectionId) {
        return res.status(400).json({
            error: "Missing required fields: grade, codeTeacher, sectionId"
        });
    }

    try {
        // Obtener el id del estudiante
        const student = await prisma.student.findFirst({
            where: { userId: userStudentId }
        });

        if (!student) {
            return res.status(404).json({
                error: "Estudiante no encontrado"
            });
        }

        const idStudent = student.id;

        // Actualizar la evaluación del docente en la tabla enrollment
        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                sectionId_studentId: {
                    sectionId: sectionId,
                    studentId: idStudent
                },
            },
            data: {
                TeacherGrade: gradeTeacher
            }
        });

        return res.status(200).json({
            message: "Nota actualizada con éxito.",
            enrollment: updatedEnrollment
        });

    } catch (error) {
        console.error("Error updating teacher grade: ", error);

        if (error.code === 'P2025') {
            // Manejo específico de errores de Prisma (P2025: registro no encontrado)
            return res.status(404).json({
                error: "Error en prisma"
            });
        }

        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
