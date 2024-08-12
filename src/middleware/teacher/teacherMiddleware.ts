import { Request, Response, NextFunction } from 'express';
import { prisma } from "../../config/db";
// Middleware para autorizar al maestro
export const authorizeTeacherMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id; // ID del usuario autenticado
    const sectionId = parseInt(req.params.id, 10); // ID de la sección desde los parámetros de la ruta

    if (!userId) {
        return res.status(401).json({ error: 'No autorizado. Usuario no autenticado.' });
    }

    if (isNaN(sectionId)) {
        return res.status(400).json({ error: 'ID de sección inválido.' });
    }

    try {
        // Obtener el teacherId de la sección
        const section = await prisma.section.findUnique({
            where: { id: sectionId },
            select: { teacherId: true }
        });

        if (!section) {
            return res.status(404).json({ error: 'Sección no encontrada.' });
        }

        // Verificar si el teacherId en la sección coincide con el userId autenticado
        if (section.teacherId !== userId) {
            return res.status(403).json({ error: 'El usuario no tiene acceso a esta sección.' });
        }

        next(); // Si la validación pasa, llamar al siguiente middleware o controlador
    } catch (error) {
        res.status(500).json({ error: `Error al validar el acceso: ${error.message}` });
    }
};