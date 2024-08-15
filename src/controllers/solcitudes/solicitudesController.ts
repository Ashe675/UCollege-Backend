import { createSolicitudCancelacionExcepcional, getSolicitudesCambioCarrera, getSolicitudesCambioCentro, getSolicitudesCancelacion, getSolicitudesPagoReposicion } from "../../services/solicitudes/solcitudesService";
import { prisma } from "../../config/db";
import { Request, Response } from 'express';

export const getSolicitudesCancelacionController = async (req: Request, res: Response) => {
        const teacherId = req.user.id;
        const { filter } = req.query;
    try {
        // Llamar al servicio para obtener las solicitudes de cancelación
       
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
      // Extraer los datos del cuerpo de la petición
      const { justificacion, sectionIds } = req.body;
      const userId = req.user.id;
      const student = await prisma.student.findFirst({
        where: {userId:userId},
        select: {id:true},
      });
      const studentId= student.id;
      // Crear el arreglo de enrollments con sectionId y studentId
      const enrollments = sectionIds.map((sectionId: number) => ({
        sectionId,
        studentId,
      }));
  
      // Llamar al servicio para crear la solicitud
      const result = await createSolicitudCancelacionExcepcional({
        justificacion,
        studentId,
        enrollments,
      });
  
      // Verificar si la solicitud fue creada con éxito
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
        success: false,
        message: 'Error interno del servidor.',
        error: error.message,
      });
    }
  };
