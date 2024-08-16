import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";


export const validatEnrollCurrent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const solicitudId = parseInt(req.params.idSolicitud);
        
        if (isNaN(solicitudId)) {
            return res.status(400).json({ error: 'ID de sección inválido' });
        }

        // Encontrar la solicitud
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: solicitudId },
            include: { student: true }  // Asegurar que se incluya el estudiante
        });

        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Buscar si el estudiante tiene clases matriculadas en el periodo académico actual
        const enrollStudent = await prisma.enrollment.findMany({
            where: {
                studentId: solicitud.studentId,
                section: {
                    academicPeriod: {
                        process: {
                            active: true  // Buscar solo en procesos activos
                        }
                    }
                }
            }
        });

        // Si el estudiante ya tiene clases matriculadas, enviar mensaje
        if (enrollStudent.length > 0) {
            return res.status(400).json({ error: 'El estudiante tiene clases matriculadas en este periodo, se recomienda realizar el cambio al finalizar el periodo actual.' });
        }

        // Si no tiene clases matriculadas, continuar con la siguiente función de middleware
        next();
    } catch (error) {
        console.error('Error en validatEnrollCurrent:', error.message);
        res.status(500).json({ error: 'Server Internal Error' });
    }
};