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


export const createSolicitudCancelacionExcepcional = async (data: {
    justificacion: string;
    teacherId: number;
    studentId: number;
    enrollments: { sectionId: number; studentId: number }[]; // Clave compuesta de IDs
  }) => {
    try {
      // Crear la solicitud
      const nuevaSolicitud = await prisma.solicitud.create({
        data: {
          justificacion: data.justificacion,
          tipoSolicitud: "CANCELACION_EXCEPCIONAL",
          estado : 'PENDIENTE',
          teacherId: data.teacherId,
          studentId: data.studentId,
          enrollments: {
            connect: data.enrollments.map(enrollment => ({
              sectionId_studentId: { // Usar el formato correcto de la clave compuesta
                sectionId: enrollment.sectionId,
                studentId: enrollment.studentId,
              },
            })),
          },
        },
        include: {
          student: {
            select: {
              user: {
                select: {
                  identificationCode: true,
                  institutionalEmail: true,
                  person: {
                    select: {
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      secondLastName: true,
                    },
                  },
                },
              },
            },
          },
          enrollments: {
            select: {
              section: {
                select: {
                  IH: true,
                  FH: true,
                  code: true,
                  class: {
                    select: {
                      code: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
  
      // Formatear la respuesta
      return {
        success: true,
        message: "Solicitud de cancelación excepcional creada con éxito.",
        data: {
          id: nuevaSolicitud.id,
          date: nuevaSolicitud.date,
          justificacion: nuevaSolicitud.justificacion,
          estado: nuevaSolicitud.estado,
          student: {
            name: `${nuevaSolicitud.student.user.person.firstName} ${nuevaSolicitud.student.user.person.middleName || ''} ${nuevaSolicitud.student.user.person.lastName} ${nuevaSolicitud.student.user.person.secondLastName || ''}`.trim(),
            identificationCode: nuevaSolicitud.student.user.identificationCode,
            institutionalEmail: nuevaSolicitud.student.user.institutionalEmail,
          },
          classesToCancel: nuevaSolicitud.enrollments.map(enrollment => {
            const section = enrollment.section;
            return {
              IH: section.IH,
              FH: section.FH,
              code: section.code,
              classCode: section.class.code,
              className: section.class.name,
            };
          }),
        },
      };
    } catch (error) {
      console.error('Error al crear la solicitud de cancelación excepcional:', error);
      return {
        success: false,
        message: 'No se pudo crear la solicitud de cancelación excepcional.',
        error: error.message,
      };
    }
  };
  
  

