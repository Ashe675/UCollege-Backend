import { Request, Response } from 'express';
import { prisma } from '../../config/db';

import { getClassesOfDepartment } from '../../services/class/getClass';

/**
 * -----------------------------------------------------------------------------
 * Autor: Cesar Banegas
 * Correo: cabanegasf@unah.hn
 * Propósito: todos los controladores para manipular clases
 * -----------------------------------------------------------------------------
 */

export const getAllClass = async (req: Request, res: Response)=>{
    const {id:userId} = req.user;
    
    try {
        const departmentUserId = (await prisma.user.findUnique({
            where: {
                id: userId
            }, include:{
                teacherDepartments: true
            }
        })).teacherDepartments[0].regionalCenter_Faculty_Career_Department_Departament_id;

        const classes = await getClassesOfDepartment(departmentUserId);
        
        return res.status(200).json(classes)

    } catch (error) {
        console.error('Error al obtener clases:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

