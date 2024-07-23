import { prisma } from '../config/db';
import { Request, Response, NextFunction } from 'express';

export const isValidDepartament = async (req: Request, res: Response, next: NextFunction) => {
    const departamentId = req.body.departamentId;

    try {
        const departament = await prisma.departament.findUnique({
            where:{
                id: parseInt(departamentId)
            }
        });

        if(!departament){
            return res.status(404).json({ message: 'El Departamento no existe' });
        }

        next();
    } catch (error) {
        console.error('Error al obtener los departamentos:', error);
        return res.status(500).json({ message: 'Error interno en el servidor' });
    }
};

export const isValidRegionalCenter = async (req: Request, res: Response, next: NextFunction) => {
    const { RegionalCenter_Faculty_Career_id } = req.body;

    try {
        const regionalCenterFacultyCareer = await prisma.regionalCenter_Faculty_Career.findUnique({
            where: {
                id: parseInt(RegionalCenter_Faculty_Career_id, 10),
            },
        });

        if (!regionalCenterFacultyCareer) {
            return res.status(404).json({ message: 'Centro regional no encontrado' });
        }

        const regionalCenter = await prisma.regionalCenter.findUnique({
            where: {
                id: regionalCenterFacultyCareer.regionalCenter_Faculty_RegionalCenterId,
            },
        });

        if (!regionalCenter) {
            return res.status(404).json({ message: 'El centro regional no existe' });
        }

        next();
    } catch (error) {
        console.error('Error al verificar el centro regional:', error);
        return res.status(500).json({ message: 'Error al verificar el centro regional' });
    }
};

export const isDepartamentInRegionalCenter = async (req: Request, res: Response, next: NextFunction) => {
    const { RegionalCenter_Faculty_Career_id, departamentId } = req.body;

    try {
        const record = await prisma.regionalCenter_Faculty_Career_Department.findUnique({
            where: {
                departmentId_regionalCenter_Faculty_CareerId: {
                    departmentId: parseInt(departamentId, 10),
                    regionalCenter_Faculty_CareerId: parseInt(RegionalCenter_Faculty_Career_id, 10),
                },
            },
        });

        if (!record) {
            return res.status(404).json({ message: 'Departamento no encontrado en el centro regional especificado' });
        }

        next();
    } catch (error) {
        console.error('Error al obtener el registro:', error);
        return res.status(500).json({ message: 'Error al obtener el registro' });
    }
};
