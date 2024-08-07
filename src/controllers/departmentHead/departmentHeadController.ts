import { Request, Response } from 'express';
import { prisma } from '../../config/db';

export const getAcademicHistory = async (req: Request, res: Response) => {
    const { id: userId } = req.user;
    const { identificationCode } = req.params;

    try {
        
        let academicHistory: { [key: string]: any } = {};

        const student = await prisma.user.findUnique({
            where:{identificationCode: identificationCode},
            include:{
                student:{
                    include: {
                        enrollments:{
                            include:{
                                section:{
                                    include:{
                                        academicPeriod:{
                                            include:{
                                                process: true
                                            }
                                        }, 
                                    }
                                    
                                }
                            }
                        },
                        
                    }
                },
                person: true,
                
            }
        })

        academicHistory['nameStudent'] = `${student.person.firstName} ${student.person.middleName}` ;
        academicHistory['lastnameStudent'] = `${student.person.lastName} ${student.person.secondLastName}`;

        academicHistory['codeIdentification'] = student.identificationCode

        academicHistory['globalAverage'] = student.student.globalAverage

        //Buscar centro regional
        const regionalCenter_career_User = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where:{userId: student.id},
            include:{
                regionalCenter_Faculty_Career:{
                    include:{
                        regionalCenter_Faculty:{
                            include:{
                                regionalCenter: true
                            }
                        },
                        career: true
                    },
                    
                }
            }
        })

        if (!regionalCenter_career_User) {
            return res.status(404).json({ error: 'No se encontró centro regional del usuario' });
        }

        academicHistory['regionalCenter'] = regionalCenter_career_User.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenter.name

        academicHistory['career'] = regionalCenter_career_User.regionalCenter_Faculty_Career.career.name

        


        if (academicHistory.length === 0) {
            return res.status(404).json({ error: 'No se encontró historial académico para el usuario' });
        }

        return res.status(200).json(academicHistory);

    } catch (error) {
        console.error('Error al obtener historial académico:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
