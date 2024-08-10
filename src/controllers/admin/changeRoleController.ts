import { Request, Response } from 'express';

import { prisma } from '../../config/db';
import { RoleEnum } from '@prisma/client';

export const changeRoleController = async (req: Request, res: Response)=>{
    let {identificationCode} = req.params;

    //let identificación = parseInt(identificaciónCode);

    const {roleName} = req.body
     // Validar si el roleName es válido y convertirlo a enum
    if (!Object.values(RoleEnum).includes(roleName as RoleEnum)) {
        return res.status(400).json({ error: 'Nombre de rol no válido.' });
    }

    try {
        // Validar si el rol existe
    const role = await prisma.role.findFirst({
        where: { name: roleName as RoleEnum },
      });
  
      if (!role) {
        return res.status(404).json({ error: 'El rol especificado no existe.' });
      }
  
      // Validar si el usuario existe
      const user = await prisma.user.findUnique({
        where: { identificationCode: identificationCode },
      });
  
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
  
      // Actualizar el rol del usuario
      await prisma.user.update({
        where: { identificationCode: identificationCode },
        data: { roleId: role.id },
      });
  
      return res.status(200).json({ message: 'Rol del usuario actualizado exitosamente.' });
    
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al cambiear de rol al usuario' });
    }

}