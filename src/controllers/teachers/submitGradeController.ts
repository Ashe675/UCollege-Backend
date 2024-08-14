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
            return res.status(404).json({ error: 'La sección no existe' });
        }

        if(grade >= 65 && (obs !== 'APR')){
            return res.status(409).json({ error: 'La observación no corresponde a la nota indicada.' });
        }

        if(grade > 0 && grade < 65 && obs !== 'REP' && obs !== 'ABD'){
            return res.status(409).json({ error: 'La observación no corresponde a la nota indicada.' });
        }

        if(grade === 0 && (obs !== 'NSP')){
            return res.status(409).json({ error: 'La observación no corresponde a la nota indicada.' });
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

        return res.status(200).send( 'Calificación actualizada exitosamente.' );
    } catch (error) {
        console.error('Error al enviar las calificaciones:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
 }