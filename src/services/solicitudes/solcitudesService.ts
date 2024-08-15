import { RoleEnum } from "@prisma/client";
import { prisma } from "../../config/db";
import { getRegionalCenterFacultyCareerTeacher } from "../../utils/teacher/getTeacherCenter";
import { uploadPdf } from "../../utils/cloudinary";

export const getSolicitudesCancelacion = async (teacherId: number, filter: string) => {
    const regionalCenter_Faculty_CareerId = await getRegionalCenterFacultyCareerTeacher(teacherId);
    const solicitudes = await prisma.solicitud.findMany({
        where: { tipoSolicitud: "CANCELACION_EXCEPCIONAL", regionalCenterFacultyCareerId: regionalCenter_Faculty_CareerId, ...(filter === 'PEND' && { estado: 'PENDIENTE' }) },
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            student: {
                select: {
                    id: true,
                    user: {
                        select: {
                            identificationCode: true,
                            institutionalEmail: true
                            , person: {
                                select: {
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                    secondLastName: true,
                                }
                            }
                        }
                    }
                }
            }, archivos: { select: { url: true } },
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
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    const formattedResponse = solicitudes.map(solicitud => {
        const studentInfo = solicitud.student.user.person;
        const studentName = `${studentInfo.firstName} ${studentInfo.middleName || ''} ${studentInfo.lastName} ${studentInfo.secondLastName || ''}`.trim();
        const studentId = solicitud.student.id;
        const identificationCode = solicitud.student.user.identificationCode;
        const institutionalEmail = solicitud.student.user.institutionalEmail;
        const archivos = solicitud.archivos.map(archivo => {
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
        where: { tipoSolicitud: "CAMBIO_DE_CENTRO" },
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            regionalCenter: { select: { id: true, name: true, town: { select: { name: true, countryDepartment: { select: { name: true } } } } } },
            student: {
                select: {
                    id: true,
                    user: {
                        select: {
                            id: true,
                            identificationCode: true,
                            institutionalEmail: true
                            , person: {
                                select: {
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                    secondLastName: true,
                                }
                            }
                        }
                    }
                }
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
        where: { tipoSolicitud: "CAMBIO_DE_CARRERA", regionalCenterFacultyCareerId: regionalCenter_Faculty_CareerId, ...(filter === 'PEND' && { estado: 'PENDIENTE' }) },
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            archivos: { select: { url: true } },
            career: { select: { id: true, code: true, name: true } },
            student: {
                select: {
                    id: true,
                    user: {
                        select: {
                            id: true,
                            identificationCode: true,
                            institutionalEmail: true
                            , person: {
                                select: {
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                    secondLastName: true,
                                }
                            }
                        }
                    }
                }
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
                            career: { select: { id: true, name: true, code: true } }
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
            const archivos = solicitud.archivos.map(archivo => {
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
        where: { tipoSolicitud: "CANCELACION_EXCEPCIONAL" },
        select: {
            date: true,
            id: true,
            estado: true,
            justificacion: true,
            student: {
                select: {
                    id: true,
                    user: {
                        select: {
                            identificationCode: true,
                            institutionalEmail: true
                            , person: {
                                select: {
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                    secondLastName: true,
                                }
                            }
                        }
                    }
                }
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
    enrollments: { sectionId: number; studentId: number }[];
    files: { originalName: string; buffer: Buffer; mimeType: string }[]; // Manejo detallado de archivos
}) => {
    try {
        // Obtener el ID del usuario a partir del studentId
        const user = await prisma.student.findFirst({
            where: { id: data.studentId },
            select: { userId: true },
        });

        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        // Obtener el RegionalCenter_Faculty_Career del usuario
        const regionalCenter_Faculty_Career = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: { userId: user.userId },
            select: { regionalCenter_Faculty_CareerId: true },
        });

        if (!regionalCenter_Faculty_Career) {
            throw new Error('No se encontró información del centro regional para el usuario.');
        }

        // Subir los archivos PDF antes de crear la solicitud
        const archivosSubidos = await Promise.all(
            data.files.map(async (file) => {
                if (!file.buffer) {
                    throw new Error(`El archivo ${file.originalName} no contiene datos.`);
                }

                // Aquí asumimos que tienes una función `uploadPdf` que maneja la subida
                const uploadResult = await uploadPdf(file.buffer, file.originalName);

                return {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                    name: file.originalName,
                    tipoArchivo: 'raw' as const,
                };
            })
        );

        // Crear la solicitud de cancelación excepcional
        const nuevaSolicitud = await prisma.solicitud.create({
            data: {
                justificacion: data.justificacion,
                tipoSolicitud: 'CANCELACION_EXCEPCIONAL',
                estado: 'PENDIENTE',
                studentId: data.studentId,
                regionalCenterFacultyCareerId: regionalCenter_Faculty_Career.regionalCenter_Faculty_CareerId,
                enrollments: {
                    connect: data.enrollments.map(enrollment => ({
                        sectionId_studentId: {
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

        // Guardar los archivos subidos en la tabla ArchivoSolicitud
        await prisma.archivoSolicitud.createMany({
            data: archivosSubidos.map(file => ({
                url: file.url,
                public_id: file.public_id,
                name: file.name,
                tipoArchivo: file.tipoArchivo,
                solicitudId: nuevaSolicitud.id,
            })),
        });

        // Formatear la respuesta
        return {
            success: true,
            message: 'Solicitud de cancelación excepcional creada con éxito.',
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

export const createSolicitudCambiodeCarrera = async (data: {
    justificacion: string;
    studentId: number;
    careerId: number;
}) => {
    try {
        // Obtener el ID del usuario a partir del studentId
        const user = await prisma.student.findFirst({
            where: { id: data.studentId },
            select: { userId: true },
        });

        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        // Obtener el RegionalCenter_Faculty_Career del usuario
        const regionalCenter_Faculty = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: { userId: user.userId },
            select: { regionalCenter_Faculty_Career: {select: {regionalCenter_Faculty_FacultyId: true, regionalCenter_Faculty_RegionalCenterId: true}} },
        });
        if (!regionalCenter_Faculty) {
            throw new Error('No se encontró información del centro regional para el usuario.');
        }
        const regionalCenter_Faculty_Career_Destino = await prisma.regionalCenter_Faculty_Career.findFirst({
            where: { regionalCenter_Faculty_RegionalCenterId: regionalCenter_Faculty.regionalCenter_Faculty_Career.regionalCenter_Faculty_RegionalCenterId, careerId: data.careerId},
            select:{id: true}
        });
        if (!regionalCenter_Faculty_Career_Destino) {
            throw new Error('Esta carrera no se encuentra en este centro');
        }
        const regionalCenter_Faculty_Career_DestinoId = regionalCenter_Faculty_Career_Destino.id;    
        // Crear la solicitud de cancelación excepcional
        const nuevaSolicitud = await prisma.solicitud.create({
            data: {
                justificacion: data.justificacion,
                tipoSolicitud: 'CAMBIO_DE_CARRERA',
                estado: 'PENDIENTE',
                studentId: data.studentId,
                careerId: data.careerId,
                regionalCenterFacultyCareerId: regionalCenter_Faculty_Career_DestinoId,
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
            },
        });

        // Formatear la respuesta
        return {
            success: true,
            message: 'Solicitud de cambio de carrera creada con éxito.',
            data: {
                id: nuevaSolicitud.id,
                date: nuevaSolicitud.date,
                justificacion: nuevaSolicitud.justificacion,
                estado: nuevaSolicitud.estado,
                carrera: nuevaSolicitud.careerId,
                student: {
                    userId: nuevaSolicitud.student.user.id,
                    name: `${nuevaSolicitud.student.user.person.firstName} ${nuevaSolicitud.student.user.person.middleName || ''} ${nuevaSolicitud.student.user.person.lastName} ${nuevaSolicitud.student.user.person.secondLastName || ''}`.trim(),
                    identificationCode: nuevaSolicitud.student.user.identificationCode,
                    institutionalEmail: nuevaSolicitud.student.user.institutionalEmail,
                },
            },
        };
    } catch (error) {
        console.error('Error al crear la solicitud de cambio de carrera:', error);
        return {
            success: false,
            message: 'No se pudo crear la solicitud de cambio de carrera.',
            error: error.message,
        };
    }
};

export const createSolicitudCambiodeCentro = async (data: {
    justificacion: string;
    studentId: number;
    regionalCenterId: number;
}) => {
    try {
        // Obtener el ID del usuario a partir del studentId
        const user = await prisma.student.findFirst({
            where: { id: data.studentId },
            select: { userId: true },
        });

        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        // Obtener la carrera del usuario
        const regionalCenter_Faculty = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: { userId: user.userId },
            select: { regionalCenter_Faculty_Career:{select:{careerId:true}}, id: true},
        });
        if (!regionalCenter_Faculty) {
            throw new Error('No se encontró información del centro regional para el usuario.');
        }
        const careerIdActual = regionalCenter_Faculty.regionalCenter_Faculty_Career.careerId;
        const regionalCenter_Faculty_Career_User_Id= regionalCenter_Faculty.id;
        // Obtener RegionalCenterFacultiyCareerId del destino
        const regionalCenter_Faculty_Career = await prisma.regionalCenter_Faculty_Career.findFirst({
            where:{regionalCenter_Faculty: {regionalCenterId: data.regionalCenterId}, careerId: careerIdActual},
            select:{id: true},
        });
        if (!regionalCenter_Faculty_Career) {
            throw new Error('Su carrera no se encuentra en el centro de destino');
        };
        const regionalCenter_Faculty_Career_DestinoId = regionalCenter_Faculty_Career.id;
        // Crear la solicitud de cancelación excepcional
        const nuevaSolicitud = await prisma.solicitud.create({
            data: {
                justificacion: data.justificacion,
                tipoSolicitud: 'CAMBIO_DE_CENTRO',
                estado: 'PENDIENTE',
                studentId: data.studentId,
                regionalCenterFacultyCareerId: regionalCenter_Faculty_Career_DestinoId,
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
            },
        });
        if (!nuevaSolicitud) {
            throw new Error('Error al crear la solicitud');
        };
        await prisma.regionalCenter_Faculty_Career_User.update({
            where: { id : regionalCenter_Faculty_Career_User_Id },
            data: { regionalCenter_Faculty_CareerId: regionalCenter_Faculty_Career_DestinoId },
        });
        // Modificar el estado de la solicitud a APROBADA
        await prisma.solicitud.update({
            where: { id: nuevaSolicitud.id },
            data: { estado: 'APROBADA' },
        });

        // Retornar el mensaje de éxito
        return {
            success: true,
            message: 'Cambio de centro realizado exitosamente.',
        };
    } catch (error) {
        console.error('Error al crear la solicitud de cambio de centro:', error);
        return {
            success: false,
            message: 'No se pudo crear la solicitud de cambio de centro.',
            error: error.message,
        };
    }
};

export const createSolicitudPagoReposicion = async (data: {
    justificacion: string;
    studentId: number;
}) => {
    try {
        // Obtener el ID del usuario a partir del studentId
        const user = await prisma.student.findFirst({
            where: { id: data.studentId },
            select: { userId: true },
        });

        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        // Obtener la carrera del usuario
        const regionalCenter_Faculty = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: { userId: user.userId },
            select: { regionalCenter_Faculty_Career:{select:{careerId:true}}, id: true},
        });
        if (!regionalCenter_Faculty) {
            throw new Error('No se encontró información del centro regional para el usuario.');
        }

        // Crear la solicitud de cancelación excepcional
        const nuevaSolicitud = await prisma.solicitud.create({
            data: {
                justificacion: data.justificacion,
                tipoSolicitud: 'PAGO_REPOSICION',
                estado: 'APROBADA',
                studentId: data.studentId,
                regionalCenterFacultyCareerId: regionalCenter_Faculty.id,
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
            },
        });
        if (!nuevaSolicitud) {
            throw new Error('Error al crear la solicitud');
        };

        // Retornar el mensaje de éxito
        return {
            success: true,
            message: 'Solicitud de pago de reposicion creada existosamente',
        };
    } catch (error) {
        console.error('Error al crear la solicitud de pago de reposicion:', error);
        return {
            success: false,
            message: 'No se pudo crear la solicitud de pago de reposicion.',
            error: error.message,
        };
    }
};







