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