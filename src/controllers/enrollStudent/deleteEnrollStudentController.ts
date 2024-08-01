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
            return res.status(404).json({ error: 'Matricula no funaciono' });
        }

        // Eliminar la matrícula
        await prisma.$transaction(async (prisma) => {
            // Eliminar registros relacionados en waitingList
            let wlist = await prisma.waitingList.deleteMany({
              where: {
                id: existingEnrollment.waitingListId,
                sectionId: sectionId,
              },
            });
        
            // Eliminar el registro en enrollment
            await prisma.enrollment.delete({
              where: {
                sectionId_studentId: { studentId, sectionId },
              },
            });

            if(wlist.count === 0 ){
              let section = await prisma.section.findUnique({
                where:{id: sectionId}
              });
              await prisma.section.update({
                where:{id: sectionId},
                data:{
                  capacity: section.capacity+1
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
