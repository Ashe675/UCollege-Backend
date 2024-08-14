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
            classesToCancel
        };
    });

    return formattedResponse;
};