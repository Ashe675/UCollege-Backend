import { prisma } from "../../config/db";
import { Request, Response } from 'express';
import { getTotalMatriculadosDepartment,
    getTotalAprobadosDepartment,
    getTotalReprobadosDepartment,
    getTotalAprobadosDepartmentActual,
    getTotalMatriculadosDepartmentActual,
    getTotalReprobadosDepartmentActual,
    getClaseConMasAprobados,
    getClaseConMasReprobados} from "../../utils/statistics/statisticsUtils";
import { getPeriodoActual } from "../../utils/section/sectionUtils";
import { getPeriodoUltimo } from "../../utils/statistics/statisticsUtils";
export const getAprobadosPorClase = async (sectionId: number) => {
    const cantidadAprobados = await prisma.enrollment.count({
      where: {
        sectionId: sectionId,
        waitingListId : null,
        active : true,
        grade: {
          gte: 65,
        },
      },
    });
    return cantidadAprobados;
  };
  export const getEstadisticasDepartment = async (req: Request) => {
    const userId = req.user.id;

    // Obtener el regionalCenterFacultyCareerId del profesor
    const regionalCenter_Faculty_Teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: { teacherId: userId },
        select: {
            regionalCenterFacultyCareerDepartment: {
                select: {
                    regionalCenter_Faculty_CareerId: true
                }
            }
        }
    });

    if (!regionalCenter_Faculty_Teacher) {
        throw new Error('No se encontró la información del profesor');
    }

    const regionalCenterFacultyCareerId = regionalCenter_Faculty_Teacher.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

    // Obtener todas las secciones del departamento según el regionalCenterFacultyCareerId
    const sections = await prisma.section.findMany({
        where: {
            regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId, active:true,
        },
        select: {
            id: true,
            class: { select: { id: true, name: true } }
        }
    });

    if (sections.length === 0) {
        return []; // Devuelve un array vacío si no hay secciones
    }

    // Agrupar secciones por clase
    const classesMap = new Map<string, { className: string, sectionIds: number[] }>();

    sections.forEach((section) => {
        const className = section.class.name;
        const classId = String(section.class.id);  // Convertir classId a string

        if (!classesMap.has(classId)) {
            classesMap.set(classId, { className, sectionIds: [] });
        }

        classesMap.get(classId)!.sectionIds.push(section.id);
    });

    // Recopilar estadísticas para cada clase
    const statistics = await Promise.all(Array.from(classesMap.values()).map(async (classData) => {
        const { className, sectionIds } = classData;
        const totalSecciones = sectionIds.length;

        const totalEnrollments = await prisma.enrollment.count({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
            },
        });

        const totalAprobados = await prisma.enrollment.count({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
                grade: {
                    gte: 65,
                },
            },
        });

        const totalReprobados = await prisma.enrollment.count({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
                grade: {
                    lt: 65,
                },
            },
        });

        const promedioNotas = await prisma.enrollment.aggregate({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
            },
            _avg: {
                grade: true,
            },
        });

        const porcentajeAprobados = totalEnrollments === 0 ? 0 : (totalAprobados / totalEnrollments) * 100;
        const porcentajeReprobados = totalEnrollments === 0 ? 0 : (totalReprobados / totalEnrollments) * 100;

        return {
            className,
            totalSecciones,  // Total de secciones por clase
            totalEnrollments,
            totalAprobados,
            totalReprobados,
            porcentajeAprobados: parseFloat(porcentajeAprobados.toFixed(2)),
            porcentajeReprobados: parseFloat(porcentajeReprobados.toFixed(2)),
            promedioNotas: promedioNotas._avg.grade ? parseFloat(promedioNotas._avg.grade.toFixed(2)) : 0,
        };
    }));

    return statistics;
};

export const getEstadisticasDepartmentUltimoPeriodo = async (req: Request) => {
    const userId = req.user.id;
    const ultimoPeriodoId = await getPeriodoUltimo();
    // Obtener el regionalCenterFacultyCareerId del profesor
    const regionalCenter_Faculty_Teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: { teacherId: userId },
        select: {
            regionalCenterFacultyCareerDepartment: {
                select: {
                    regionalCenter_Faculty_CareerId: true
                }
            }
        }
    });

    if (!regionalCenter_Faculty_Teacher) {
        throw new Error('No se encontró la información del profesor');
    }

    const regionalCenterFacultyCareerId = regionalCenter_Faculty_Teacher.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

    // Obtener todas las secciones del departamento según el regionalCenterFacultyCareerId
    const sections = await prisma.section.findMany({
        where: {
            regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId, active:true,academicPeriodId:ultimoPeriodoId,
        },
        select: {
            id: true,
            class: { select: { id: true, name: true } }
        }
    });

    if (sections.length === 0) {
        return []; // Devuelve un array vacío si no hay secciones
    }

    // Agrupar secciones por clase
    const classesMap = new Map<string, { className: string, sectionIds: number[] }>();

    sections.forEach((section) => {
        const className = section.class.name;
        const classId = String(section.class.id);  // Convertir classId a string

        if (!classesMap.has(classId)) {
            classesMap.set(classId, { className, sectionIds: [] });
        }

        classesMap.get(classId)!.sectionIds.push(section.id);
    });

    // Recopilar estadísticas para cada clase
    const statistics = await Promise.all(Array.from(classesMap.values()).map(async (classData) => {
        const { className, sectionIds } = classData;
        const totalSecciones = sectionIds.length;

        const totalEnrollments = await prisma.enrollment.count({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
            },
        });

        const totalAprobados = await prisma.enrollment.count({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
                grade: {
                    gte: 65,
                },
            },
        });

        const totalReprobados = await prisma.enrollment.count({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
                grade: {
                    lt: 65,
                },
            },
        });

        const promedioNotas = await prisma.enrollment.aggregate({
            where: {
                waitingListId: null,
                active: true,
                sectionId: { in: sectionIds },
            },
            _avg: {
                grade: true,
            },
        });

        const porcentajeAprobados = totalEnrollments === 0 ? 0 : (totalAprobados / totalEnrollments) * 100;
        const porcentajeReprobados = totalEnrollments === 0 ? 0 : (totalReprobados / totalEnrollments) * 100;

        return {
            className,
            totalSecciones,  // Total de secciones por clase
            totalEnrollments,
            totalAprobados,
            totalReprobados,
            porcentajeAprobados: parseFloat(porcentajeAprobados.toFixed(2)),
            porcentajeReprobados: parseFloat(porcentajeReprobados.toFixed(2)),
            promedioNotas: promedioNotas._avg.grade ? parseFloat(promedioNotas._avg.grade.toFixed(2)) : 0,
        };
    }));

    return statistics;
};


// export const getEstadisticasDepartmentActual = async (req: Request) => {
//   const userId = req.user.id;
//   const idPeriodo = await getPeriodoActual();
//       // Obtener el regionalCenterFacultyCareerId del profesor
//       const regionalCenter_Faculty_Teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
//         where: { teacherId: userId },
//         select: {
//             regionalCenterFacultyCareerDepartment: {
//                 select: {
//                     regionalCenter_Faculty_CareerId: true
//                 }
//             }
//         }
//     });

//     if (!regionalCenter_Faculty_Teacher) {
//         throw new Error('No se encontró la información del profesor');
//     }

//     const regionalCenterFacultyCareerId = regionalCenter_Faculty_Teacher.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

//     // Obtener todas las secciones del departamento según el regionalCenterFacultyCareerId
//     const sections = await prisma.section.findMany({
//         where: {
//             regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId,
//             academicPeriodId: idPeriodo,
//         },
//         select: {
//             id: true,
//             code: true,  
//             class: {select:{name:true}}  
//         }
//     });

//     if (sections.length === 0) {
//         return []; // Devuelve un array vacío si no hay secciones
//     }

//     // Recopilar estadísticas para cada sección
//     const statistics = await Promise.all(sections.map(async (section) => {
//         const totalEnrollments = await prisma.enrollment.count({
//             where: {
//                 sectionId: section.id,
//             },
//         });

//         const totalAprobados = await prisma.enrollment.count({
//             where: {
//                 sectionId: section.id,
//                 grade: {
//                     gte: 65,
//                 },
//             },
//         });

//         const totalReprobados = await prisma.enrollment.count({
//             where: {
//                 sectionId: section.id,
//                 grade: {
//                     lt: 65,
//                 },
//             },
//         });

//         const promedioNotas = await prisma.enrollment.aggregate({
//             where: {
//                 sectionId: section.id,
//             },
//             _avg: {
//                 grade: true,
//             },
//         });

//         const porcentajeAprobados = totalEnrollments === 0 ? 0 : (totalAprobados / totalEnrollments) * 100;
//         const porcentajeReprobados = totalEnrollments === 0 ? 0 : (totalReprobados / totalEnrollments) * 100;

//         return {
//             sectionId: section.id,
//             sectionCode: section.code,
//             className: section.class.name,
//             totalEnrollments,
//             totalAprobados,
//             totalReprobados,
//             porcentajeAprobados: parseFloat(porcentajeAprobados.toFixed(2)),
//             porcentajeReprobados: parseFloat(porcentajeReprobados.toFixed(2)),
//             promedioNotas: promedioNotas._avg.grade ? parseFloat(promedioNotas._avg.grade.toFixed(2)) : 0,
//         };
//     }));

//     return statistics;
// };
export const getReprobadosPorClase= async(sectionId: number) => {
    const cantidadReprobados = await prisma.enrollment.count({
      where: {
        sectionId: sectionId,
        waitingListId : null,
        active : true,
        grade: {
          lt: 65,
        },
      },
    });
    return cantidadReprobados;
  };

export const getPorcentajeAprobados = async (sectionId: number) => {
    // Total de estudiantes inscritos en la clase
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        waitingListId : null,
        active : true,
        sectionId: sectionId,
      },
    });
  
    // Total de estudiantes aprobados en la clase
    const cantidadAprobados = await prisma.enrollment.count({
      where: {
        waitingListId : null,
        active : true,
        sectionId: sectionId,
        grade: {
          gte: 65,
        },
      },
    });
  
    // Cálculo del porcentaje
    const porcentajeAprobados = (cantidadAprobados / totalEnrollments) * 100;
    
    return parseFloat(porcentajeAprobados.toFixed(2));
  };
export const getPorcentajeReprobados = async (sectionId: number) => {
    // Total de estudiantes inscritos en la clase
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        waitingListId : null,
        active : true,
        sectionId: sectionId,
      },
    });
  
    // Total de estudiantes aprobados en la clase
    const cantidadReprobados = await prisma.enrollment.count({
      where: {
        waitingListId : null,
        active : true,
        sectionId: sectionId,
        grade: {
          lt: 65,
        },
      },
    });
  
    // Cálculo del porcentaje
    const porcentajeAprobados = (cantidadReprobados / totalEnrollments) * 100;
    
    return parseFloat(porcentajeAprobados.toFixed(2));
  };
export const getPorcentajeAprobadosDepartamento = async (req: Request) => {
    const cantidadTotalMatriculados = await getTotalMatriculadosDepartment(req);
    const cantidadTotalAprobados = await getTotalAprobadosDepartment(req);

    if (cantidadTotalMatriculados === 0) {
        return 0; // Evita división por cero
    }

    const porcentajeAprobados = (cantidadTotalAprobados / cantidadTotalMatriculados) * 100;
    return parseFloat(porcentajeAprobados.toFixed(2));
};

export const getPorcentajeAprobadosDepartamentoActual = async (req: Request) => {
    console.log("error");
    const cantidadTotalMatriculados = await getTotalMatriculadosDepartmentActual(req);
    
    const cantidadTotalAprobados = await getTotalAprobadosDepartmentActual(req);

    if (cantidadTotalMatriculados === 0) {
        return 0; // Evita división por cero
    }
    
    const porcentajeAprobados = (cantidadTotalAprobados / cantidadTotalMatriculados) * 100;
    return parseFloat(porcentajeAprobados.toFixed(2));
};

export const getPorcentajeReprobadosDepartamento = async (req:Request) =>{
    const cantidadTotalMatriculados = await getTotalMatriculadosDepartment(req);
    const cantidadTotalReprobados = await getTotalReprobadosDepartment(req);

    if (cantidadTotalMatriculados === 0) {
        return 0; // Evita división por cero
    }

    const porcentajeReprobados= (cantidadTotalReprobados / cantidadTotalMatriculados) * 100;
    return parseFloat(porcentajeReprobados.toFixed(2));
};

export const getPorcentajeReprobadosDepartamentoActual = async (req:Request) =>{
    const cantidadTotalMatriculados = await getTotalMatriculadosDepartmentActual(req);
    const cantidadTotalReprobados = await getTotalReprobadosDepartmentActual(req);

    if (cantidadTotalMatriculados === 0) {
        return 0; // Evita división por cero
    }

    const porcentajeReprobados= (cantidadTotalReprobados / cantidadTotalMatriculados) * 100;
    return parseFloat(porcentajeReprobados.toFixed(2));
};

export const getClaseConMasAprobado = async (req:Request) =>{
    const claseMasAprobados = await getClaseConMasAprobados(req);
    return claseMasAprobados;
};
export const getClaseConMasReprobado = async (req:Request) =>{
    const claseMasAprobados = await getClaseConMasReprobados(req);
    return claseMasAprobados;
};


  