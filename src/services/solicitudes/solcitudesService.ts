import { RoleEnum } from "@prisma/client";
import { prisma } from "../../config/db";
import { getRegionalCenterFacultyCareerTeacher } from "../../utils/teacher/getTeacherCenter";

export const getSolicitudesCancelacion = async (teacherId: number, filter: string) => {
    const regionalCenter_Faculty_CareerId = await getRegionalCenterFacultyCareerTeacher(teacherId);
    const solicitudes = await prisma.solicitud.findMany({
        where: {tipoSolicitud: "CANCELACION_EXCEPCIONAL", regionalCenterFacultyCareerId: regionalCenter_Faculty_CareerId, ...(filter === 'PEND' && { estado: 'PENDIENTE' })},  
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
        },archivos: {select: {url: true}},
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
        const archivos  = solicitud.archivos.map(archivo => {
            return archivo.url;
        });
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
            archivos,
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

export const getSolicitudesCambioCarrera = async (teacherId: number, filter: string) => {
    const regionalCenter_Faculty_CareerId = await getRegionalCenterFacultyCareerTeacher(teacherId);
    const solicitudes = await prisma.solicitud.findMany({
        where: {tipoSolicitud: "CAMBIO_DE_CARRERA", regionalCenterFacultyCareerId: regionalCenter_Faculty_CareerId, ...(filter === 'PEND' && { estado: 'PENDIENTE' })},
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            archivos: {select: {url: true}},
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
            const archivos  = solicitud.archivos.map(archivo => {
                return archivo.url;
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
                CarreraActual,
                CarreraSolicitada,
                archivos
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

//Funcion de apoyo
export const getCoordinadorCarrera = async (studentId: number) => {
    // Obtener el userId asociado al studentId
    const student = await prisma.student.findFirst({
        where: { id: studentId },
        select: { userId: true }
    });

    if (!student) {
        throw new Error('Student not found');
    }

    const userId = student.userId;

    // Obtener el regionalCenter_Faculty_CareerId asociado al userId
    const carreraEstudiante = await prisma.regionalCenter_Faculty_Career_User.findFirst({
        where: { userId: userId },
        select: { regionalCenter_Faculty_CareerId: true }
    });

    if (!carreraEstudiante) {
        throw new Error('No career found for this student');
    }

    const regionalCenterFacultyCareerId = carreraEstudiante.regionalCenter_Faculty_CareerId;

    // Obtener los maestros asociados a la carrera
    const maestrosCarrera = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findMany({
        where: {
            regionalCenterFacultyCareerDepartment: {
                regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId
            }
        },
        select: { teacherId: true }
    });

    const teacherIds = maestrosCarrera.map((m) => m.teacherId);

    // Buscar al coordinador de carrera (roleId: 3) que tenga un teacherId en la lista obtenida
    const coordinador = await prisma.user.findFirst({
        where: {
            id: { in: teacherIds },
            roleId: 3
        },
        select: { id: true } // Puedes ajustar los campos según necesites
    });

    if (!coordinador) {
        throw new Error('No hay un coordinador de carrera para este estudiante');
    }

    return coordinador.id;
};

export const createSolicitudCancelacionExcepcional = async (data: {
    justificacion: string;
    studentId: number;
    enrollments: { sectionId: number; studentId: number }[]; // Clave compuesta de IDs
  }) => {
    const coordinadorId= await getCoordinadorCarrera(data.studentId);
    const user = await prisma.student.findFirst({
        where: {id: data.studentId},
        select: {userId: true}
    });
    const regionalCenter_Faculty_Career = await prisma.regionalCenter_Faculty_Career_User.findFirst({
        where: {userId: user.userId},
        select: {regionalCenter_Faculty_CareerId: true}
    });

    try {
      // Crear la solicitud
      const nuevaSolicitud = await prisma.solicitud.create({
        data: {
          justificacion: data.justificacion,
          tipoSolicitud: "CANCELACION_EXCEPCIONAL",
          estado : 'PENDIENTE',
          studentId: data.studentId,
          regionalCenterFacultyCareerId: regionalCenter_Faculty_Career.regionalCenter_Faculty_CareerId,
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
                  id: true,
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
            userId: nuevaSolicitud.student.user.id,
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
  
  

