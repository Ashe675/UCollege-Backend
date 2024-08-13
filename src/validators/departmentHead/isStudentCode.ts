import { prisma } from "../../config/db";
import { Request, Response, NextFunction } from 'express';

export const isStudentCode = async (req: Request, res: Response, next: NextFunction) => {
    const identificationCode = req.params.identificationCode || req.body.identificationCode;

    
    try {
        if (!identificationCode) {
            
            return res.status(400).json({ error: 'El código de identificación es requerido.' });
        }
        const user = await prisma.user.findUnique({
                where: { identificationCode: identificationCode },
                include:{
                    role: true
                }
            });
        if (!user) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
    
        const student = await prisma.student.findUnique({ where: { userId: user.id } });
        if (!student || user.role.name !== 'STUDENT') {
            return res.status(403).json({ error: 'El usuario no tiene el rol de estudiante' });
        }
    
        next();
        
    } catch (error) {
        console.error('Error al validar el código de estudiante:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }

    
}