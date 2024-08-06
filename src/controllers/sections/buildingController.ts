import { Request, Response } from 'express';
import { prisma } from '../../config/db';

import { getBuildingByRegionalCenterId } from '../../services/building/getBuilding';

/**
 * -----------------------------------------------------------------------------
 * Autor: Cesar Banegas
 * Correo: cabanegasf@unah.hn
 * Propósito: retornar todos los edificios deacuerdo al centro regional del 
 * jefe de departemento
 * -----------------------------------------------------------------------------
 */
export const getAllBuilding = async (req: Request, res: Response) => {
    const {id:userId} = req.user;
    

    try {
        const teacher = await prisma.user.findUnique({ where: { id: userId } });
        if (!teacher) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }

        const regionalCenter = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
            where: {
                teacherId: teacher.id,
                //active: true,
            }
        });
        if (!regionalCenter) {
            return res.status(404).json({ error: 'Centro regional no encontrado para el profesor activo' });
        }

        const regionalCenterId = regionalCenter.regionalCenter_Faculty_Career_Department_Departament_id;

        const buildings = await getBuildingByRegionalCenterId(regionalCenterId);

        if ( buildings.length === 0) {
            return res.status(404).json({ error: 'No se encontraron edificios para el centro regional' });
        }

        return res.status(200).json(buildings);

    } catch (error) {
        console.error('Error al obtener edificios:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}