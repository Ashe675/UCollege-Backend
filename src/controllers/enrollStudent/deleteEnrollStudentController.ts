import { Request, Response } from 'express';
import { prisma } from '../../config/db';

// Controlador para eliminar una matrícula
export const removeEnrollment = async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const { id: userId } = req.user;

    try {

        const studentId = (await prisma.student.findUnique({where:{userId: userId}})).id;
        // Verificar si el estudiante está matriculado en la sección
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                sectionId_studentId: { studentId, sectionId: parseInt(sectionId) },
            },
        });

        if (!existingEnrollment) {
            return res.status(404).json({ error: 'Matricula no funaciono' });
        }

        // Eliminar la matrícula
        await prisma.enrollment.delete({
            where: {
                sectionId_studentId: { studentId, sectionId: parseInt(sectionId) },
            },
        });

        return res.status(200).json({ message: `Estudiante Elimino clase exitosamente en la seccion con id ${sectionId}` });
    } catch (error) {
        console.error('Error Al eliminar seccion:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
