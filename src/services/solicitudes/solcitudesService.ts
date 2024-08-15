import { RoleEnum } from "@prisma/client";
import { prisma } from "../../config/db";

export const getSolicitudesCancelacion = async () => {
    const solicitudes = await prisma.solicitud.findMany({
        where: {tipoSolicitud: "CANCELACION_EXCEPCIONAL"},
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            student: {
            select:{
                id: true,
                user:{
                select:{
                    identificationCode: true,
                    institutionalEmail: true
                    ,person:{
                    select:{
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        secondLastName: true,
                    }
                }}
            }}
        },
        enrollments: {select: {section: {
            select:{
                IH: true,
                FH: true,
                code: true,
                class: {select: {
                    code: true,
                    name: true}}
            }
        }}}
    }
    })
    const formattedResponse = solicitudes.map(solicitud => {
        const studentInfo = solicitud.student.user.person;
        const studentName = `${studentInfo.firstName} ${studentInfo.middleName || ''} ${studentInfo.lastName} ${studentInfo.secondLastName || ''}`.trim();
        const studentId = solicitud.student.id;
        const identificationCode = solicitud.student.user.identificationCode;
        const institutionalEmail = solicitud.student.user.institutionalEmail;
        // Formatear las secciones de las solicitudes
        const classesToCancel = solicitud.enrollments.map(enrollment => {
            const section = enrollment.section;
            return {
                IH: section.IH,
                FH: section.FH,
                code: section.code,
                classCode: section.class.code,
                className: section.class.name
            };
        });

        return {
            id: solicitud.id,
            date: solicitud.date,
            justificacion: solicitud.justificacion,
            estado: solicitud.estado,
            studentName,
            studentId,
            identificationCode,
            institutionalEmail,
            classesToCancel
        };
    });

    return formattedResponse;
};

export const getSolicitudesCambioCentro = async () => {
    const solicitudes = await prisma.solicitud.findMany({
        where: {tipoSolicitud: "CAMBIO_DE_CENTRO"},
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            regionalCenter: {select: {id: true, name: true,town: {select: {name: true, countryDepartment: {select:{name: true}}}}}},
            student: {
            select:{
                id: true,
                user:{
                select:{
                    id: true,
                    identificationCode: true,
                    institutionalEmail: true
                    ,person:{
                    select:{
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        secondLastName: true,
                    }
                }}
            }}
        },
    }
    });
    const formattedResponse = await Promise.all(
        solicitudes.map(async (solicitud) => {
            const CentroRegional = await prisma.regionalCenter_Faculty_Career_User.findFirst({
                where: { userId: solicitud.student.user.id },
                select: {
                    regionalCenter_Faculty_Career: {
                        select: {
                            regionalCenter_Faculty: {
                                select: {
                                    regionalCenter: {
                                        select: {
                                            id: true,
                                            name: true,
                                            town: {
                                                select: {
                                                    name: true,
                                                    countryDepartment: {
                                                        select: { name: true }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            const studentInfo = solicitud.student.user.person;
            const studentName = `${studentInfo.firstName} ${studentInfo.middleName || ''} ${studentInfo.lastName} ${studentInfo.secondLastName || ''}`.trim();
            const studentId = solicitud.student.id;
            const identificationCode = solicitud.student.user.identificationCode;
            const CentroActual = CentroRegional.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenter;
            const CentroSolicitado = solicitud.regionalCenter;
            const institutionalEmail = solicitud.student.user.institutionalEmail;
            
    
            return {
                id: solicitud.id,
                date: solicitud.date,
                justificacion: solicitud.justificacion,
                estado: solicitud.estado,
                studentName,
                studentId,
                identificationCode,
                institutionalEmail,
                CentroActual,
                CentroSolicitado,
            };
        })
    );

    return formattedResponse;
};

export const getSolicitudesCambioCarrera = async () => {
    const solicitudes = await prisma.solicitud.findMany({
        where: {tipoSolicitud: "CAMBIO_DE_CARRERA"},
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            career: {select:{id: true,code: true, name: true}},
            student: {
            select:{
                id: true,
                user:{
                select:{
                    id: true,
                    identificationCode: true,
                    institutionalEmail: true
                    ,person:{
                    select:{
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        secondLastName: true,
                    }
                }}
            }}
        },
    }
    });
    const formattedResponse = await Promise.all(
        solicitudes.map(async (solicitud) => {
            const carrera = await prisma.regionalCenter_Faculty_Career_User.findFirst({
                where: { userId: solicitud.student.user.id },
                select: {
                    regionalCenter_Faculty_Career: {
                        select: {
                            career: {select:{id: true, name: true, code: true}}
                        }
                    }
                }
            });
            const studentInfo = solicitud.student.user.person;
            const studentName = `${studentInfo.firstName} ${studentInfo.middleName || ''} ${studentInfo.lastName} ${studentInfo.secondLastName || ''}`.trim();
            const studentId = solicitud.student.id;
            const identificationCode = solicitud.student.user.identificationCode;
            const CarreraActual = carrera.regionalCenter_Faculty_Career.career;
            const CarreraSolicitada = solicitud.career;
            const institutionalEmail = solicitud.student.user.institutionalEmail;
            return {
                id: solicitud.id,
                date: solicitud.date,
                justificacion: solicitud.justificacion,
                estado: solicitud.estado,
                studentName,
                studentId,
                identificationCode,
                institutionalEmail,
                CarreraActual,
                CarreraSolicitada,
            };
        })
    );

    return formattedResponse;
};

export const getSolicitudesPagoReposicion = async () => {
    const solicitudes = await prisma.solicitud.findMany({
        where: {tipoSolicitud: "CANCELACION_EXCEPCIONAL"},
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            student: {
            select:{
                id: true,
                user:{
                select:{
                    identificationCode: true,
                    institutionalEmail: true
                    ,person:{
                    select:{
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        secondLastName: true,
                    }
                }}
            }}
        },
    }
    })
    const formattedResponse = solicitudes.map(solicitud => {
        const studentInfo = solicitud.student.user.person;
        const studentName = `${studentInfo.firstName} ${studentInfo.middleName || ''} ${studentInfo.lastName} ${studentInfo.secondLastName || ''}`.trim();
        const studentId = solicitud.student.id;
        const identificationCode = solicitud.student.user.identificationCode;
        const institutionalEmail = solicitud.student.user.institutionalEmail;
        // Formatear las secciones de las solicitudes

        return {
            id: solicitud.id,
            date: solicitud.date,
            justificacion: solicitud.justificacion,
            estado: solicitud.estado,
            studentName,
            studentId,
            identificationCode,
            institutionalEmail,
        };
    });

    return formattedResponse;
};


  

