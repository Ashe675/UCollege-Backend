import { prisma } from '../config/db';
import { Request, Response, NextFunction } from 'express';
import deleteImage from '../utils/admission/fileHandler';

export const isValidDepartament = async (req: Request, res: Response, next: NextFunction) => {
    const departamentId = req.body.departamentId;

    try {
        const departament = await prisma.departament.findUnique({
            where:{
                id: parseInt(departamentId)
            }
        });

        if(!departament){
            await deleteImage(req.file.path)
            return res.status(404).json({ message: 'El Departamento no existe' });
        }

        next();
    } catch (error) {
        console.error('Error al obtener los departamentos:', error);
        await deleteImage(req.file.path)
        return res.status(500).json({ message: 'Error interno en el servidor' });
    }
};

export const isValidRegionalCenter = async (req: Request, res: Response, next: NextFunction) => {
    const { regionalCenterId, departamentId } = req.body;

    try {
        const regionalCenter = await prisma.regionalCenter.findUnique({
            where: {
                id: parseInt(regionalCenterId),
            },
        });

        if (!regionalCenter) {
            await deleteImage(req.file.path)
            return res.status(404).json({ message: 'El centro regional no existe' });
        }

        const career = await prisma.career.findFirst({
            where : {
                departament : {
                    id : parseInt(departamentId)
                }
            }
        })

        if(!career){
            await deleteImage(req.file.path)
            return res.status(404).json({ message: 'No existe una carrera con este departemento' });
        }

        const regionalCenterFacultyCareer = await prisma.regionalCenter_Faculty_Career.findFirst({
            where: {
                regionalCenter_Faculty_RegionalCenterId : parseInt(regionalCenterId),
                careerId : career.id
            },
        });

        if (!regionalCenterFacultyCareer) {
            await deleteImage(req.file.path)
            return res.status(404).json({ message: 'Centro regional Facultad Carrera no encontrado' });
        }

        req.body.RegionalCenter_Faculty_Career_id = regionalCenterFacultyCareer.id
        
        next();
    } catch (error) {
        console.error('Error al verificar el centro regional:', error);
        await deleteImage(req.file.path)
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
            await deleteImage(req.file.path)
            return res.status(404).json({ message: 'Departamento no encontrado en el centro regional especificado' });
        }

        next();
    } catch (error) {
        await deleteImage(req.file.path)
        console.error('Error al obtener el registro:', error);
        return res.status(500).json({ message: 'Error al obtener el registro' });
    }
};
