import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import e from 'cors';

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
                images: {
                    where : { avatar : true},
                    select : {url : true}
                }
                
            }
        })

        academicHistory['nameStudent'] = `${student.person.firstName} ${student.person.middleName}` ;
        academicHistory['lastnameStudent'] = `${student.person.lastName} ${student.person.secondLastName}`;

        academicHistory['codeIdentification'] = student.identificationCode

        academicHistory['globalAverage'] = student.student.globalAverage
        academicHistory['avatar'] = student.images

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
        
        academicHistory['regionalCenter'] = regionalCenter_career_User.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenter.name;
        
        academicHistory['career'] = regionalCenter_career_User.regionalCenter_Faculty_Career.career.name;
        

        

        // Realiza la consulta para obtener las inscripciones
        const enrollments = await prisma.enrollment.findMany({
            where: {
            studentId: student.student.id,
            waitingListId : null,
            active :  true
            },
            include:{
                section:{
                    include:{
                        class:true,
                        academicPeriod:true
                    }
                }
            }
        });
        
        // Extrae los años de las inscripciones
        const years = enrollments.map(enrollment => {
            // Asumiendo que tienes una propiedad 'enrollmentDate' o similar en tu modelo de inscripciones
            return new Date(enrollment.date).getFullYear();
        });
        
        // Elimina los años duplicados
        const uniqueYears = [...new Set(years)];


        academicHistory['years'] = {};

        // Inicializa un array vacío para cada año
        

        uniqueYears.forEach(year => {
            academicHistory['years'][year] = {
              enrollments: [], // Array para almacenar las inscripciones
              totalAprov: 0    // Inicializar contador de clases aprobadas en 0
            };
          });
      
        // Llena academicHistory con las clases cursadas en cada año
        enrollments.forEach(enrollment => {
            const year = new Date(enrollment.date).getFullYear(); // Obtener el año de la inscripción
            if (enrollment.grade != null) {
            const enrollmentDetails = {
                "codigo": enrollment.section.class.code,
                "nombre": enrollment.section.class.name,
                "uv/ca": enrollment.section.class.UV,
                "periodo": enrollment.section.academicPeriod.number,
                "Nota": enrollment.grade,
                "obs": enrollment.OBS
            };
        
            // Agregar inscripción al array del año correspondiente
            academicHistory['years'][year].enrollments.push(enrollmentDetails);
        
            // Si la inscripción es aprobada, incrementa el contador de clases aprobadas
            if (enrollmentDetails.obs === "APR") {
                academicHistory['years'][year].totalAprov++;
            }
            }
        });

        // Variables para almacenar las sumas
        let totalNotas = 0;
        let totalUV = 0;
        academicHistory['SumUVxNota'] = 0;
        for (let year in academicHistory['years']) {
            // Recorre cada inscripción en el array 'enrollments' de ese año
            academicHistory['years'][year].enrollments.forEach(enrollment => {
                if(enrollment.Nota != 0){

                    totalUV += enrollment["uv/ca"]; // Suma las UV
                    academicHistory['SumUVxNota'] += enrollment.Nota*enrollment["uv/ca"];
                }
            });
        }

        academicHistory['SumUV'] = totalUV;
        
        academicHistory['academicIndex'] = Math.round(academicHistory['SumUVxNota'] / totalUV);

        
        await prisma.student.update({
            where:{
                id:student.student.id
            },
            data:{
                globalAverage: academicHistory['academicIndex']
            }
        })
        
        

        return res.status(200).json(academicHistory);

    } catch (error) {
        console.error('Error al obtener historial académico:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
