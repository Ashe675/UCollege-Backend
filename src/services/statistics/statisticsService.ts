import { prisma } from "../../config/db";
import { Request } from 'express';
import { getTotalMatriculadosDepartment,
    getTotalAprobadosDepartment,
    getTotalReprobadosDepartment,
    getTotalAprobadosDepartmentActual,
    getTotalMatriculadosDepartmentActual,
    getTotalReprobadosDepartmentActual,
    getClaseConMasAprobados,
    getClaseConMasReprobados} from "../../utils/statistics/statisticsUtils";

export const getAprobadosPorClase = async (sectionId: number) => {
    const cantidadAprobados = await prisma.enrollment.count({
      where: {
        sectionId: sectionId,
        grade: {
          gte: 65,
        },
      },
    });
    return cantidadAprobados;
  };
export const getReprobadosPorClase= async(sectionId: number) => {
    const cantidadReprobados = await prisma.enrollment.count({
      where: {
        sectionId: sectionId,
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
        sectionId: sectionId,
      },
    });
  
    // Total de estudiantes aprobados en la clase
    const cantidadAprobados = await prisma.enrollment.count({
      where: {
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
        sectionId: sectionId,
      },
    });
  
    // Total de estudiantes aprobados en la clase
    const cantidadReprobados = await prisma.enrollment.count({
      where: {
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


  