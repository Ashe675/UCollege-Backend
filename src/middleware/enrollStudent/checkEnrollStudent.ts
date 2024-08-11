import { Request,Response,NextFunction } from "express";
import { prisma } from "../../config/db";

export const checkEnrollStudent = async (req: Request, res: Response, next: NextFunction)=>{
    const {id:idUser} = req.user;
    const {identificationCode, sectionId, grade, obs} = req.body;

    try {
        //Obtener seccion
        const section = await prisma.section.findUnique({
            where: {
                id: sectionId,
                active: true,
            }, include:{
                enrollments:true
            }
        })

        if(!section){
            return res.status(404).json({ error: 'Seccion no activa o no existe esta seccion con el docente actual o no existe' });
        }

        //obtener estudiante
        const student = await prisma.user.findFirst({
            where:{
                identificationCode: identificationCode,
                role:{name: 'STUDENT'}
            },
            include:{
                student:{
                    include:{enrollments:true}
                }
            }
        });

        if(!student){
            return res.status(404).json({ error: 'El codigo de identificacion no es de un estudiante o el estudinte no existe' });
        }
        
        // Verificar si el estudiante está matriculado en la sección
        const isEnrolled = student.student.enrollments.some(enrollment => enrollment.sectionId === sectionId);

        if (!isEnrolled) {
            return res.status(404).json({ error: 'El estudiante no está matriculado en esta sección.' });
        }
        next();

    } catch (error) {
        console.error('Error al validar si el estudiante esta matriculado en la seccion:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}