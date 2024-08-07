import { prisma } from '../../config/db';
import { Request } from 'express';
export const getTotalMatriculadosDepartment = async (req:Request)=>{
    const userId = req.user.id;
    const user=await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where:{teacherId: userId},
        select: {regionalCenterFacultyCareerDepartment:{select:{regionalCenter_Faculty_CareerId:true}}}
    })
    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;
    const matriculados = await prisma.enrollment.count({
        where:{section:{regionalCenter_Faculty_Career:{id: regionalCenterFacultyCareerId}}}
    });
    return matriculados;
};

export const getTotalMatriculadosDepartmentActual = async (req:Request)=>{
    const userId = req.user.id;
    const periodo = await getPeriodoUltimo();
    const user=await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where:{teacherId: userId},
        select: {regionalCenterFacultyCareerDepartment:{select:{regionalCenter_Faculty_CareerId:true}}}
    })
    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;
    const matriculados = await prisma.enrollment.count({
        where:{section:{regionalCenter_Faculty_Career:{id: regionalCenterFacultyCareerId},academicPeriodId: periodo}}
    });
    return matriculados;
};
export const getTotalAprobadosDepartment = async (req:Request)=>{
    const userId = req.user.id;
    const user=await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where:{teacherId: userId},
        select: {regionalCenterFacultyCareerDepartment:{select:{regionalCenter_Faculty_CareerId:true}}}
    });
    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;
    const cantidadAprobados = await prisma.enrollment.count({
        where: {
          section:{regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId},
          grade: {
            gte: 65,
          },
        },
      });
    return cantidadAprobados;
};
const getPeriodoUltimo = async () => {
    const periodo = await prisma.academicPeriod.findFirst({
        where: {
            process: {
                active: false,
                finalDate: {
                    lt: new Date(), // Asegúrate de que el período haya finalizado antes o en la fecha actual
                },
                processTypeId : 5,
            },  
        },
        orderBy: {
            process:{finalDate: 'desc', }// Ordenar por fecha final en orden descendente}
        },
    });
    const periodoId = periodo.id;
    console.log(periodoId);
    return periodoId;
};

export const getTotalAprobadosDepartmentActual = async (req:Request)=>{
    const userId = req.user.id;
    const periodo = await getPeriodoUltimo();
    const user=await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where:{teacherId: userId},
        select: {regionalCenterFacultyCareerDepartment:{select:{regionalCenter_Faculty_CareerId:true}}}
    });
    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;
    const cantidadAprobados = await prisma.enrollment.count({
        where: {
          section:{regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId, academicPeriodId: periodo},
          grade: {
            gte: 65,
          },
          
        },
      });
    return cantidadAprobados;
}

export const getTotalReprobadosDepartmentActual = async (req:Request)=>{
    const userId = req.user.id;
    const periodo = await getPeriodoUltimo();
    const user=await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where:{teacherId: userId},
        select: {regionalCenterFacultyCareerDepartment:{select:{regionalCenter_Faculty_CareerId:true}}}
    });
    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;
    const cantidadReprobados = await prisma.enrollment.count({
        where: {
          section:{regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId, academicPeriodId: periodo},
          grade: {
            lt: 65,
          },
          
        },
      });
    return cantidadReprobados;
};
export const getTotalReprobadosDepartment = async (req:Request)=>{
    const userId = req.user.id;
    const user=await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where:{teacherId: userId},
        select: {regionalCenterFacultyCareerDepartment:{select:{regionalCenter_Faculty_CareerId:true}}}
    });
    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;
    const cantidadReprobados = await prisma.enrollment.count({
        where: {
          section:{regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId},
          grade: {
            lt: 65,
          },
        },
      });
    return cantidadReprobados;
};
export const getClaseConMasReprobados = async (req: Request) => {
    const userId = req.user.id;
    const periodoId = await getPeriodoUltimo();
    
    // Obtener el ID del departamento
    const user = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: { teacherId: userId },
        select: { regionalCenterFacultyCareerDepartment: { select: { regionalCenter_Faculty_CareerId: true } } },
    });

    if (!user) {
        throw new Error("No se encontró información del usuario.");
    }

    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

    // Obtener todas las secciones del departamento en el período académico actual
    const secciones = await prisma.section.findMany({
        where: {
            regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId,
            academicPeriodId: periodoId,
        },
        select: { id: true },
    });

    if (secciones.length === 0) {
        throw new Error("No se encontraron secciones para el departamento en el período académico actual.");
    }

    // Contar la cantidad de estudiantes reprobados en cada sección
    const reprobadosPorSeccion = await Promise.all(
        secciones.map(async (seccion) => {
            const cantidadReprobados = await prisma.enrollment.count({
                where: {
                    sectionId: seccion.id,
                    grade: {
                        lt: 65,
                    },
                },
            });
            return { sectionId: seccion.id, cantidadReprobados };
        })
    );

    // Encontrar la sección con la mayor cantidad de estudiantes reprobados
    const seccionConMasReprobados = reprobadosPorSeccion.reduce((prev, current) => 
        (prev.cantidadReprobados > current.cantidadReprobados) ? prev : current
    );

    return seccionConMasReprobados;
};
export const getClaseConMasAprobados = async (req: Request) => {
    const userId = req.user.id;
    const periodoId = await getPeriodoUltimo();
    
    // Obtener el ID del departamento
    const user = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: { teacherId: userId },
        select: { regionalCenterFacultyCareerDepartment: { select: { regionalCenter_Faculty_CareerId: true } } },
    });

    if (!user) {
        throw new Error("No se encontró información del usuario.");
    }

    const regionalCenterFacultyCareerId = user.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

    // Obtener todas las secciones del departamento en el período académico actual
    const secciones = await prisma.section.findMany({
        where: {
            regionalCenter_Faculty_CareerId: regionalCenterFacultyCareerId,
            academicPeriodId: periodoId,
        },
        select: { class:{select:{name : true}},code : true, id: true},
    });

    if (secciones.length === 0) {
        throw new Error("No se encontraron secciones para el departamento en el período académico actual.");
    }

    // Contar la cantidad de estudiantes aprobados en cada sección
    const aprobadosPorSeccion = await Promise.all(
        secciones.map(async (seccion) => {
            const cantidadAprobados = await prisma.enrollment.count({
                where: {
                    sectionId: seccion.id,
                    grade: {
                        gte: 65,
                    },
                },
            });
            return { sectionId: seccion.id,sectionCode: seccion.code, sectionClass: seccion.class.name, cantidadAprobados };
        })
    );

    // Encontrar la sección con la mayor cantidad de estudiantes aprobados
    const seccionConMasAprobados = aprobadosPorSeccion.reduce((prev, current) => 
        (prev.cantidadAprobados > current.cantidadAprobados) ? prev : current
    );

    return seccionConMasAprobados;
};