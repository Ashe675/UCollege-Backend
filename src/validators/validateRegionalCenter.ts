import { prisma } from '../config/db';
import { Request, Response, NextFunction } from 'express';

export const isValidDepartament = async (req: Request, res: Response, next: NextFunction) => {
    const { RegionalCenter_Faculty_Career_id } = req.body;

    try {
        const regionalCenter_Faculty_Career = await prisma.regionalCenter_Faculty_Career.findUnique({
            where:{
                id: parseInt(RegionalCenter_Faculty_Career_id)
            }
        });

        if(regionalCenter_Faculty_Career){
            const department = await prisma.departament.findUnique({
                where: {
                    careerId: regionalCenter_Faculty_Career.careerId,
                    
                }
                
            });
            
            if(!department){
                return res.status(404).json({ message: 'El Departamento no existe' });
            }

        }

        
        next();
        //return res.status(200).json(department);
    } catch (error) {
        console.error('Error al obtener los departamentos:', error);
        return res.status(500).json({ message: 'Error interno en el servidor' });
    }
};

export async function isValidRegionalCenter(req: Request, res: Response, next: NextFunction) {
    const { RegionalCenter_Faculty_Career_id } = req.body;

    try {
        // Buscar el centro regional en la tabla RegionalCenter_Faculty_Career
        const regionalCenterFacultyCareer = await prisma.regionalCenter_Faculty_Career.findUnique({
            where: {
                id: parseInt(RegionalCenter_Faculty_Career_id, 10),
            },
        });

        if (!regionalCenterFacultyCareer) {
            return res.status(404).json({ message: 'Centro regional no encontrado en la tabla RegionalCenter_Faculty_Career' });
        }

        const regionalCenter = await prisma.regionalCenter.findUnique({
            where: {
                id: regionalCenterFacultyCareer.regionalCenter_Faculty_RegionalCenterId,
            },
        });

        // Verificar si el centro regional existe
        if (!regionalCenter) {
            return res.status(404).json({ message: 'El centro regional no existe' });
        }

        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al verificar el centro regional' });
    }
}
