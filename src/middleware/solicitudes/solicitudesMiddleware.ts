import { Request, Response, NextFunction } from 'express';
import { prisma } from "../../config/db";
import multer from 'multer';

const upload = multer();

// Middleware para verificar que al menos un archivo sea seleccionado
export const fileUploadMiddleware = upload.array('files', 10); // Ajusta el límite de archivos según sea necesario

export const validateFilesPresence = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({ error: 'Debe seleccionar al menos un archivo' });
  }
  next();
};

export const checkSolicitudPendCancelacion = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const student = await prisma.student.findFirst({
        where: { userId: userId }
    });
    const studentId = student.id;
    try {
        const existingSolicitud = await prisma.solicitud.findFirst({
            where: { estado: 'PENDIENTE', studentId: studentId, tipoSolicitud: 'CANCELACION_EXCEPCIONAL' }
        })
        if (existingSolicitud) {
            return res.status(400).json({ error: 'Ya tiene una solicitud pendiente para cancelar clases' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server erroree Jose' });
    }
};

export const checkSolicitudPendCambioCarrera = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const careerId = req.body.careerId;
    const carrera = await prisma.career.findFirst({ 
        where:{id:careerId}
    });
    if (!carrera) {
        return res.status(404).json({ error: 'Carrera no encontrada' });
    }
    const student = await prisma.student.findFirst({
        where: { userId: userId }
    });
    const studentId = student.id;
    try {
        const existingSolicitud = await prisma.solicitud.findFirst({
            where: { estado: 'PENDIENTE', studentId: studentId, tipoSolicitud: 'CAMBIO_DE_CARRERA' }
        })
        if (existingSolicitud) {
            return res.status(400).json({ error: 'Ya tiene una solicitud pendiente para cambio de carrera' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server erroree Jose' });
    }
};

export const checkSolicitudReposicion = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;

    try {
        // Obtener el estudiante basado en el userId
        const student = await prisma.student.findFirst({
            where: { userId: userId }
        });

        if (!student) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        const studentId = student.id;

        // Buscar el último proceso activo con processTypeId igual a 8
        const activeProcess = await prisma.process.findFirst({
            where: {
                processTypeId: 8,
                active: true,
                finalDate: { gte: new Date() },
                startDate: { lte: new Date() }
            },
            orderBy: { startDate: 'desc' }, // Ordenar por fecha de inicio descendente para obtener el último proceso
            take: 1
        });

        if (!activeProcess) {
            return res.status(404).json({ error: 'No hay procesos activos de reposición disponibles' });
        }

        // Buscar si ya existe una solicitud de pago de reposición en el rango de fechas del proceso activo
        const existingSolicitud = await prisma.solicitud.findFirst({
            where: {
                studentId: studentId,
                tipoSolicitud: 'PAGO_REPOSICION',
                date: {
                    gte: activeProcess.startDate,
                    lte: activeProcess.finalDate
                }
            }
        });

        if (existingSolicitud) {
            return res.status(400).json({ error: 'Ya tiene una solicitud de pago de reposición en este periodo' });
        }

        // Si no hay solicitudes existentes en el rango de fechas, pasar al siguiente middleware
        next();
    } catch (error) {
        console.error('Error checking solicitud de reposición:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const checkSolicitudCambioCentro = async (req: Request, res: Response, next: NextFunction) => {
    const currentDate = new Date();
    const userId = req.user.id; // ID del usuario desde el token o sesión
    const regionalCenterId = req.body.regionalCenterId;

    try {
        // Verificar si el centro regional existe
        const regionalCenter = await prisma.regionalCenter.findFirst({
            where: { id: regionalCenterId }
        });

        if (!regionalCenter) {
            return res.status(404).json({ error: 'Centro regional no encontrado' });
        }

        // Obtener el AcademicPeriod activo
        const activeAcademicPeriod = await prisma.academicPeriod.findFirst({
            where: {
                process: {
                    processTypeId: 5, // Periodo académico
                    active: true,
                    finalDate: { gte: currentDate },
                    startDate: { lte: currentDate }
                }
            },
            select: { id: true }
        });

        if (activeAcademicPeriod) {
            // Buscar el estudiante asociado al usuario
            const student = await prisma.student.findFirst({
                where: { userId: userId },
                select: { id: true }
            });

            if (!student) {
                return res.status(404).json({ error: 'Estudiante no encontrado' });
            }

            // Verificar si el estudiante tiene inscripciones en el AcademicPeriod activo
            const hasActiveEnrollment = await prisma.enrollment.findFirst({
                where: {
                    studentId: student.id,
                    section: {
                        academicPeriodId: activeAcademicPeriod.id
                    }
                }
            });

            if (hasActiveEnrollment) {
                // Bloquear la solicitud si el estudiante tiene inscripciones en este periodo académico
                return res.status(400).json({ error: 'No se puede realizar un cambio de centro mientras tiene clases matriculadas' });
            }
        }

        // Si no hay un AcademicPeriod activo o no tiene inscripciones, pasar al siguiente middleware
        next();
    } catch (error) {
        console.error('Error checking solicitud cambio de centro:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getCoordinadorCarreraActualTeacher = async (userId: number) => {

    // Obtener el regionalCenter_Faculty_CareerId asociado al userId
    const carreraTeacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: { teacherId: userId },
        select: { regionalCenterFacultyCareerDepartment: { select: { regionalCenter_Faculty_CareerId: true } } }
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

export const validateEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id; // ID del usuario desde el token o sesión
    const sectionIdsString = req.body.sectionIds; // IDs de las secciones a validar como una cadena

    try {
        // Verificar que `sectionIds` sea una cadena de texto
        if (typeof sectionIdsString !== 'string') {
            return res.status(400).json({ error: 'sectionIds debe ser una cadena de texto' });
        }

        // Convertir la cadena de texto en un arreglo de números
        const sectionIds = sectionIdsString.split(',')
            .map(id => id.trim())
            .filter(id => !isNaN(Number(id)) && Number(id) > 0)
            .map(id => Number(id));

        if (sectionIds.length === 0) {
            return res.status(400).json({ error: 'Al menos un sectionId debe ser proporcionado' });
        }

        // Buscar el estudiante asociado al usuario
        const student = await prisma.student.findFirst({
            where: { userId: userId },
            select: { id: true } // Solo necesitamos el ID del estudiante
        });

        if (!student) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        const studentId = student.id;

        // Buscar las inscripciones del estudiante y extraer los sectionIds válidos
        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: studentId, sectionId: { in: sectionIds } },
            select: { sectionId: true }
        });

        // Verificar si todos los sectionIds están en enrollments
        const validSectionIds = enrollments.map(enrollment => enrollment.sectionId);
        const invalidSectionIds = sectionIds.filter(id => !validSectionIds.includes(id));

        if (invalidSectionIds.length > 0) {
            return res.status(400).json({ error: `No se encuentra matriculado en las siguientes secciones: ${invalidSectionIds.join(', ')}` });
        }

        // Si todos los IDs son válidos, pasar al siguiente middleware
        next();
    } catch (error) {
        console.error('Error validating enrollments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

