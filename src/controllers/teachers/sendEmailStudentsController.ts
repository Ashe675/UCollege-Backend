import { Request, Response } from "express"
import { prisma } from "../../config/db";
import { sendEmailGrades } from "../../services/mail/emailService";


export const sendEmailStudentController=async(req:Request, res:Response)=>{
    const {id:userId} = req.user;
    const {sectionId} = req.body;
    
    if(!sectionId) {
        return res.status(402).json({error: "Se necesita el id de la sección..."})
    }

    try {
        //obtener el id del proceso de periodo academo activo
        const processId = (await prisma.process.findFirst({
            where:{
                processTypeId: 5,
                active: true,
            }
        })).id

        if(!processId){
            return res.status(402).json({error: "No se encontro proceso de periodo ..."})
        }

        
        //obtener todas las secciones que pertenezcan al proceso de tipo perioado academico y que sean del docente
        const section = await prisma.section.findUnique({
            where: {
                id: sectionId,
                teacherId: userId,
            },
            include: {
                enrollments: {
                    where :{
                      waitingListId : null  
                    },
                    include: {
                        student: {
                            include: {
                                user: {
                                    include: { person: true }
                                }
                            }
                        }
                    }
                },
                class: true
            }
        });

        if(!section){
            return res.status(402).json({error: "No se encontró la sección."})
        }

        // Verificar si todos los enrollments tienen grade y OBS
        const allEnrollmentsComplete = 
            section.enrollments.every(enroll =>
                enroll.grade !== null && enroll.grade !== undefined &&
                enroll.OBS !== null && enroll.OBS !== undefined
            );
        

        if (!allEnrollmentsComplete) {
            return res.status(400).json({ error: "No se han completado todas las notas y observaciones de los estudiantes." });
        }

        // Enviar correos electrónicos a los estudiantes
        
        let clase = section.class.name
        for (const enrollment of section.enrollments) {
            const student = enrollment.student;
            const email = student.user.person.email;
            const firstName = student.user.person.firstName;
            const lastName = student.user.person.lastName;


            await sendEmailGrades(firstName, lastName, email, clase);
        }
        

        return res.status(200).send( "Correos electrónicos enviados con éxito." );

        
    } catch (error) {
        console.error('Error al enviar correos electrónicos:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
        
    }
}