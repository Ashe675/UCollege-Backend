 import { Request, Response } from "express"
 import { prisma } from "../../config/db";
 
 export const submitGradesController = async (req: Request, res: Response)=>{
    const {id:idUser} = req.user;
    const {identificationCode, sectionId, grade, obs} = req.body;


    try {
        //Obtener la seccion del docente
        const section = await prisma.section.findFirst({
            where: {
            id: sectionId,
            teacherId: idUser,
            active: true,
            },
            include: {
                teacher: true,
                class: true,
                enrollments:true,
            }
        });

        const studentId = (await prisma.user.findUnique({where:{identificationCode: identificationCode}, include: {student:true}})).student.id;

        if(!section){
            return res.status(404).json({ error: 'Seccion no activa o no existe esta seccion con el docente actual o no existe' });
        }

        await prisma.enrollment.update({
            where:{
                sectionId_studentId: {
                    sectionId: section.id,
                    studentId: studentId
                }
            },
            data:{
                grade: grade,
                OBS: obs
            }
        });

        return res.status(200).send( 'Calificaciones actualizadas exitosamente.' );
    } catch (error) {
        console.error('Error al enviar las calificaciones:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
 }