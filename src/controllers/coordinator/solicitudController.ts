import { prisma } from "../../config/db"
import { Request, Response } from "express"

export const accetSolicitudCarrer = async (req: Request, res: Response) => {
    const { id: userId } = req.user;
    let idSolicitud = parseInt(req.params.idSolicitud);

    try {
        // Verificar que la solicitud sea válida
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: idSolicitud },
            include: {
                career: true,
                enrollments: true,
                student: { include: { user: true } },
                teacher: {
                    include: {
                        teacherDepartments: {
                            include: {
                                regionalCenterFacultyCareerDepartment: {
                                    include: {
                                        RegionalCenterFacultyCareer: {
                                            include: {
                                                regionalCenter_Faculty: {
                                                    include: {
                                                        faculty: true,
                                                        regionalCenter: true,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                regionalCenterFacultyCareer: {
                    include: {
                        regionalCenter_Faculty: {
                            include: {
                                faculty: true,
                                regionalCenter: true,
                            }
                        }
                    }
                }
            }
        });

        if (!solicitud) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        // Buscar la carrera
        const newCarrer = await prisma.career.findUnique({
            where: { id: solicitud.career.id },
        });

        if (!newCarrer) {
            return res.status(404).json({ error: "Carrera no encontrada" });
        }

        // Buscar la relación de usuario y facultad carrera a actualizar
        const regionalCenterFacultyCareerUser = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: { userId: solicitud.student.userId, regionalCenter_Faculty_CareerId: solicitud.regionalCenterFacultyCareerId },
        });

        if (!regionalCenterFacultyCareerUser) {
            return res.status(404).json({ error: "Relación usuario-facultad-carrera no encontrada" });
        }

        const today = new Date();

        // Actualizar la fecha de finalización
        await prisma.regionalCenter_Faculty_Career_User.update({
            where: { id: regionalCenterFacultyCareerUser.id },
            data: {
                finalDate: today,
            }
        });

        // Obtener el regional center faculty career del docente
        const regionalCenter_Faculty_Career_coordinator = await prisma.regionalCenter_Faculty_Career.findFirst({
            where: {
                active: true,
                career: solicitud.career,
                regionalCenter_Faculty_FacultyId: solicitud.teacher.teacherDepartments[0].regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty_FacultyId,
                regionalCenter_Faculty_RegionalCenterId: solicitud.teacher.teacherDepartments[0].regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty_RegionalCenterId,
            }
        });

        if (!regionalCenter_Faculty_Career_coordinator) {
            return res.status(404).json({ error: "Coordinador no encontrado" });
        }

        // Crear un nuevo registro de usuario en regional center faculty career user
        const newRegionalCFCU = await prisma.regionalCenter_Faculty_Career_User.create({
            data: {
                userId: userId,
                startDate: today,
                regionalCenter_Faculty_CareerId: regionalCenter_Faculty_Career_coordinator.id,
            }
        });

        await prisma.solicitud.update({
            where:{id:solicitud.id},
            data:{estado:"APROBADA"}
        })

        // Enviar respuesta exitosa
        res.status(200).json({ message: "Solicitud aceptada con éxito", newRegionalCFCU });

    } catch (error) {
        console.error(error);  // Para ver más detalles del error en el servidor
        res.status(500).json({ error: "Ocurrió un error en el servidor" });
    }
};



export const declineSolicitud = async (req: Request, res: Response) => {
    const { id: userId } = req.user;
    let idSolicitud = parseInt(req.params.idSolicitud);

    try {
        // Verificar si la solicitud existe
        const solicitudExistente = await prisma.solicitud.findUnique({
            where: { id: idSolicitud },
        });

        if (!solicitudExistente) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        // Actualizar el estado de la solicitud a "RECHAZADA"
        const solicitud = await prisma.solicitud.update({
            where: { id: idSolicitud },
            data: {
                estado: "RECHAZADA",
            },
        });

        // Enviar una respuesta exitosa
        res.status(200).json({ message: "Solicitud rechazada con éxito", solicitud });

    } catch (error) {
        console.error(error);  // Para ver más detalles del error en el servidor
        res.status(500).json({ error: "Ocurrió un error en el servidor" });
    }
};


export const accetSolicitudClass = async (req: Request, res: Response) => {
    const { id: userId } = req.user;
    let idSolicitud = parseInt(req.params.idSolicitud);

    try {
        // Verificar si la solicitud existe
        const solicitudExistente = await prisma.solicitud.findUnique({
            where: { id: idSolicitud },
        });

        if (!solicitudExistente) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        // Buscar solicitud con los datos necesarios
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: idSolicitud },
            include:{
                student: true,
                career: true,
                enrollments: true,
            }
        });

        // Buscar enrollments del estudiante y colocarle 0
        const enrollmentUpdates = solicitud.enrollments.map(enrollment =>
            prisma.enrollment.update({
                where: {
                    sectionId_studentId: {
                        sectionId: enrollment.sectionId,
                        studentId: solicitud.studentId,
                    },
                },
                data: {
                    grade: 0,
                },
            })
        );

        // Ejecutar todas las actualizaciones de forma paralela
        await Promise.all(enrollmentUpdates);

        // Actualizar el estado de la solicitud a "APROBADA"
        await prisma.solicitud.update({
            where: { id: idSolicitud },
            data: {
                estado: "APROBADA"
            }
        });

        // Enviar una respuesta exitosa
        res.status(200).json({ message: "Solicitud aprobada con éxito", solicitud });

    } catch (error) {
        console.error(error);  // Para ver más detalles del error en el servidor
        res.status(500).json({ error: "Ocurrió un error en el servidor" });
    }
};
