import { Request, Response, NextFunction } from 'express';
import { prisma } from "../../config/db";


export const checkSolicitudPendCancelacion = async (req: Request, res: Response, next: NextFunction) => {
    const userId= req.user.id;
    const student = await prisma.student.findFirst({
        where:{userId: userId}
    });
    const studentId = student.id;
    try {
        const existingSolicitud = await prisma.solicitud.findFirst({
            where:{estado: 'PENDIENTE', studentId: studentId}
        })
        if (existingSolicitud) {
            return res.status(400).json({ error: 'Ya tiene una solicitud pendiente para cancelar clases' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server erroree Jose' });
    }
  };

const getCoordinadorCarreraActualTeacher = async (userId: number) => {

    // Obtener el regionalCenter_Faculty_CareerId asociado al userId
    const carreraTeacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: { teacherId: userId },
        select: { regionalCenterFacultyCareerDepartment:{select:{regionalCenter_Faculty_CareerId:true}} }
    });

    if (!carreraTeacher) {
        throw new Error('No hay una carrera asociada a este docente');
    }

    const regionalCenterFacultyCareerId = carreraTeacher.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId

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

