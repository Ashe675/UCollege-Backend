import { Request, Response } from 'express';
import { prisma } from '../../config/db';

// Controlador para eliminar una matrícula
export const removeEnrollment = async (req: Request, res: Response) => {
    let sectionId = parseInt(req.params.sectionId);
    const { id: userId } = req.user;
    

    try {
        const student = await prisma.student.findUnique({where:{userId: userId}})
        const studentId = (student).id;
        
        // Verificar si el estudiante está matriculado en la sección
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                sectionId_studentId: { studentId, sectionId: sectionId },
            },
        });

        if (!existingEnrollment) {
            return res.status(404).json({ error: 'Matricula no funciono' });
        }

        // Eliminar la matrícula
        await prisma.$transaction(async (prisma) => {
            
            // Eliminar el registro en enrollment
            await prisma.enrollment.delete({
              where: {
                sectionId_studentId: { studentId, sectionId },
              },
            });

            let enrollment = await prisma.enrollment.findFirst({
              where:{
                sectionId : sectionId,
                waitingListId: {not: null},
                
              },
              orderBy:{
                date:"asc"
              }
              
            });

            if(enrollment){
                await prisma.enrollment.update({
                  where:{
                    sectionId_studentId:{sectionId, studentId}
                  },
                  data:{
                    waitingListId: null
                  }
                });
            }

            
          });

        return res.status(200).json({ message: `Estudiante Elimino clase exitosamente en la seccion con id ${sectionId}` });
    } catch (error) {
        console.error('Error Al eliminar seccion:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
