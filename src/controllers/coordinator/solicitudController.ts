import { prisma } from "../../config/db"
import { Request, Response } from "express"
import { estadoSolicitud, RoleEnum } from "@prisma/client";

export const accetSolicitudCarrer = async (req: Request, res: Response) => {
    const { id: userId } = req.user;
    let idSolicitud = parseInt(req.params.idSolicitud);

    // Validar si el idSolicitud es un número válido
    
    try {
        if (isNaN(idSolicitud)) {
            return res.status(400).json({ error: "ID de solicitud inválido" });
        }
        // Verificar que la solicitud sea válida
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: idSolicitud, estado: "PENDIENTE" },
            include: {
                career: true,
                student: { include: { user: true } },
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

        const regionalCenterCarrerStudent = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: {
                userId: solicitud.student.userId,
                finalDate: null,
            },
            include: { regionalCenter_Faculty_Career: true }
        });

        if (!regionalCenterCarrerStudent) {
            return res.status(404).json({ error: "Relación usuario-facultad-carrera del estudiante no encontrada" });
        }

        if (regionalCenterCarrerStudent.regionalCenter_Faculty_Career.careerId === solicitud.regionalCenterFacultyCareer.careerId) {
            return res.status(400).json({ error: "Se está intentando cambiar a la misma carrera" });
        }

        const teacher = await prisma.user.findUnique({
            where: { id: userId,
                role:{
                    name:"COORDINATOR"
                }
             },
            include: { teacherDepartments: true }
        });

        if (!teacher) {
            return res.status(404).json({ error: "Docente no encontrado" });
        }

        const teacherDepartmentCarrer = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
            where: { teacherId: teacher.id, active: true },
            include: {
                regionalCenterFacultyCareerDepartment: {
                    include: {
                        RegionalCenterFacultyCareer: { include: { career: true } }
                    }
                }
            }
        });

        if (!teacherDepartmentCarrer) {
            return res.status(404).json({ error: "Departamento de facultad del docente no encontrado" });
        }

        if (teacherDepartmentCarrer.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.career.id != solicitud.career.id) {
            return res.status(400).json({ error: "El docente no es de la carrera a la que se quiere cambiar el estudiante" });
        }

        if (teacherDepartmentCarrer.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.career.id === regionalCenterCarrerStudent.regionalCenter_Faculty_Career.careerId) {
            return res.status(400).json({ error: "El docente no es de la misma carrera que el estudiante" });
        }

        const newCarrer = await prisma.career.findUnique({ where: { id: solicitud.career?.id } });

        if (!newCarrer) {
            return res.status(404).json({ error: "Carrera no encontrada" });
        }

        const regionalCenterFacultyCareerUser = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: {
                userId: solicitud.student.user.id,
                regionalCenter_Faculty_CareerId: solicitud.regionalCenterFacultyCareerId,
            },
        });

        if (!regionalCenterFacultyCareerUser) {
            return res.status(404).json({ error: "Relación usuario-facultad-carrera no encontrada" });
        }

        const today = new Date();

        // Actualizar la fecha de finalización
        await prisma.regionalCenter_Faculty_Career_User.update({
            where: { id: regionalCenterFacultyCareerUser.id },
            data: { finalDate: today },
        });

        // Crear un nuevo registro
        const newRegionalCFCU = await prisma.regionalCenter_Faculty_Career_User.create({
            data: {
                userId: userId,
                startDate: today,
                regionalCenter_Faculty_CareerId: solicitud.regionalCenterFacultyCareerId,
            },
        });

        // Actualizar el estado de la solicitud
        await prisma.solicitud.update({
            where: { id: solicitud.id },
            data: { estado: "APROBADA" },
        });

        // Verifica que no se hayan enviado encabezados antes de enviar la respuesta
        if (!res.headersSent) {
            return res.status(200).json({ message: "Solicitud aceptada con éxito", newRegionalCFCU });
        }

    } catch (error) {
        console.error('Error en el controlador accetSolicitudCarrer:', error);

        // Verifica si ya se enviaron los encabezados
        if (!res.headersSent) {
            return res.status(500).json({ error: "Ocurrió un error en el servidor" });
        }
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
        return res.status(200).json({ message: "Solicitud rechazada con éxito", solicitud });

    } catch (error) {
        console.error(error);  // Para ver más detalles del error en el servidor
        return res.status(500).json({ error: "Ocurrió un error en el servidor" });
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
        return res.status(200).json({ message: "Solicitud aprobada con éxito", solicitud });

    } catch (error) {
        console.error(error);  // Para ver más detalles del error en el servidor
        return res.status(500).json({ error: "Ocurrió un error en el servidor" });
    }
};
