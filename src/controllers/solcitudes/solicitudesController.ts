import { getSolicitudesCancelacion } from "../../services/solicitudes/solcitudesService";
import { Request, Response } from 'express';

export const getSolicitudesCancelacionController = async (req: Request, res: Response) => {
    try {
        // Llamar al servicio para obtener las solicitudes de cancelación
        const solicitudes = await getSolicitudesCancelacion();

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