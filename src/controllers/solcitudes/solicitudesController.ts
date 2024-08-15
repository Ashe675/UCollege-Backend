import { createSolicitudCancelacionExcepcional, getSolicitudesCambioCarrera, getSolicitudesCambioCentro, getSolicitudesCancelacion, getSolicitudesPagoReposicion } from "../../services/solicitudes/solcitudesService";
import { prisma } from "../../config/db";
import { Request, Response } from 'express';

export const getSolicitudesCancelacionController = async (req: Request, res: Response) => {
    const teacherId = req.user.id;
    const { filter } = req.query;
    try {
        // Llamar al servicio para obtener las solicitudes de cancelación
        if (filter !== "PEND") {
            return res.status(400).json({
                error: 'El filtro solo puede ser "PEND".'
            });
        }
        const solicitudes = await getSolicitudesCancelacion(teacherId, filter as string);

        // Devolver la respuesta en formato JSON
        return res.status(200).json({
            data: solicitudes
        });
    } catch (error) {
        // Manejar errores
        console.error('Error al obtener solicitudes de cancelación:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener solicitudes de cancelación'
        });
    }
};

export const getSolicitudesCambioCentroController = async (req: Request, res: Response) => {
    const teacherId = req.user.id;
    try {
        // Llamar al servicio para obtener las solicitudes de cancelación
        const solicitudes = await getSolicitudesCambioCentro();

        // Devolver la respuesta en formato JSON
        return res.status(200).json({
            success: true,
            data: solicitudes
        });
    } catch (error) {
        // Manejar errores
        console.error('Error al obtener solicitudes de cancelación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes de cancelación'
        });
    }
};

export const getSolicitudesCambioCarreraController = async (req: Request, res: Response) => {
    const teacherId = req.user.id;
    const { filter } = req.query;
    try {
        if (filter !== "PEND") {
            return res.status(400).json({
                success: false,
                error: 'El filtro solo puede ser "PEND".'
            });
        }
        // Llamar al servicio para obtener las solicitudes de cancelación
        const solicitudes = await getSolicitudesCambioCarrera(teacherId, filter as string);

        // Devolver la respuesta en formato JSON
        return res.status(200).json({
            data: solicitudes
        });
    } catch (error) {
        // Manejar errores
        console.error('Error al obtener solicitudes de cancelación:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener solicitudes de cancelación'
        });
    }
};

export const getSolicitudesPagoReposicionController = async (req: Request, res: Response) => {
    try {
        // Llamar al servicio para obtener las solicitudes de cancelación
        const solicitudes = await getSolicitudesPagoReposicion();

        // Devolver la respuesta en formato JSON
        return res.status(200).json({
            success: true,
            data: solicitudes
        });
    } catch (error) {
        // Manejar errores
        console.error('Error al obtener solicitudes de cancelación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes de cancelación'
        });
    }
};

export const createSolicitudCancelacionExcepcionalController = async (req: Request, res: Response) => {
    try {
        const { justificacion, sectionIds } = req.body;
        const userId = req.user.id;

        // Obtener el ID del estudiante
        const student = await prisma.student.findFirst({
            where: { userId: userId },
            select: { id: true },
        });

        if (!student) {
            return res.status(400).json({ message: 'Estudiante no encontrado.' });
        }

        const studentId = student.id;

        // Crear el arreglo de enrollments con sectionId y studentId
        const enrollments = sectionIds.split(',').map((sectionId: string) => ({
            sectionId: Number(sectionId),
            studentId,
        }));

        const files = req.files as Express.Multer.File[];

        // Verificar si se subieron archivos
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No se han subido archivos.' });
        }

        // Procesar los archivos (ejemplo: subirlos a un servicio externo)
        const fileData = files.map(file => ({
            originalName: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype
        }));

        // Llamar al servicio para crear la solicitud
        const result = await createSolicitudCancelacionExcepcional({
            justificacion,
            studentId,
            enrollments,
            files: fileData // Procesar los archivos en memoria
        });

        if (result.success) {
            return res.status(201).json(result);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Error al crear la solicitud.',
                error: result.error,
            });
        }
    } catch (error) {
        console.error('Error en el controlador createSolicitudCancelacionExcepcional:', error);
        return res.status(500).json({
            message: 'Error interno del servidor.',
            error: error.message,
        });
    }
};

