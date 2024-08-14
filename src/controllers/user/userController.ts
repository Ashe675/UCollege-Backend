import { Request, Response } from 'express';
import { getUserData } from '../../services/user/userService';

import { validationResult } from 'express-validator';
import exp from 'constants';
import { prisma } from '../../config/db';
import { image } from 'pdfkit';

export const getUserDataController = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = parseInt(req.params.userId, 10);

  try {
    const userData = await getUserData(userId);
    return res.status(200).json(userData);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};


export const getProfile = async (req: Request, res: Response) => {
  let userId: number;

  // Obtener el ID del usuario desde los parámetros o la sesión
  if (req.params.userId) {
    userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      //return res.status(400).json({ message: 'Invalid userId' });
      userId = req.user.id; // Suponiendo que el middleware 'authenticate' asigna 'req.user'
    }
  } 

  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        person: true,
        images: true,
        carrers: {
          include:{
            regionalCenter_Faculty_Career:{
              include:{
                career:true
              }
            }
          }
        },
      },
    });

    if (!userData) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const simplifiedData = {
      id: userData.id,
      identificationCode: userData.identificationCode,
      active: userData.active,
      institutionalEmail: userData.institutionalEmail,
      person: {
        firstName: userData.person.firstName,
        lastName: userData.person.lastName,
        email: userData.person.email
      },
      carrers: userData.carrers.map(career => ({
        id: career.regionalCenter_Faculty_Career.career.id,
        name: career.regionalCenter_Faculty_Career.career.name
      })),
      images: userData.images.map(image=>({
        id: image.idImage,
        url: image.url,
        avatar: image.avatar,
      }))
    };

    res.status(200).json(simplifiedData);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
