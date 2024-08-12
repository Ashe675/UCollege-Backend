import { Request, Response } from "express"
import { prisma } from "../../config/db";
import { sendEmailGrades } from "../../services/mail/emailService";


export const sendEmailStudentController=async(req:Request, res:Response)=>{
    const {id:userId} = req.user;
    

    try {
        //obtener el id del proceso de periodo academo activo
        const processId = (await prisma.process.findFirst({
            where:{
                processTypeId: 5,
                active: true,
            }
        })).id

        if(!processId){
            return res.status(402).json({messeage: "No se encontro proceso de periodo ..."})
        }

        
        //obtener todas las secciones que pertenezcan al proceso de tipo perioado academico y que sean del docente
        const sections = await prisma.section.findMany({
            where: {
                teacherId: userId,
                academicPeriod: {
                    process: {
                        id: processId
                    }
                }
            },
            include: {
                enrollments: {
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

        if(sections.length===0){
            return res.status(402).json({messeage: "No se encontraron secciones o no existen en este periodo academico"})
        }

        // Enviar correos electrónicos a los estudiantes
        for (const section of sections) {
            let clase = section.class.name
            for (const enrollment of section.enrollments) {
                const student = enrollment.student;
                const email = student.user.person.email;
                const firstName = student.user.person.firstName;
                const lastName = student.user.person.lastName;

                const url = `http://localhost:5173/auth/login`; // Ajusta la URL según tu plataforma

                await sendEmailGrades(firstName, lastName, url, email, clase);
            }
        }

        return res.status(200).json({ message: "Correos electrónicos enviados con éxito." });

        
    } catch (error) {
        console.error('Error al enviar correos electrónicos:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
        
    }
}