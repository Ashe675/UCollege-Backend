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
      return res.status(400).json({ error: 'Usuario no encontrado!' });
    }
  } 

  try {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        person: true,
        images: true,
        teacherDepartments: {
          include: {
            regionalCenterFacultyCareerDepartment: {
              include: {
                Departament: true,
                RegionalCenterFacultyCareer: {
                  include: {
                    regionalCenter_Faculty: {
                      include: { regionalCenter: true },
                    },
                  },
                },
              },
            },
          },
        },
        carrers: {
          include: {
            regionalCenter_Faculty_Career: {
              include: {
                career: true,
                regionalCenter_Faculty: {
                  include: { regionalCenter: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const avatarUrl = userData.images.find(image => image.avatar)?.url || null;
    
    let regionalCenterName = userData.carrers.find(career => 
      career.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenter.name
    )?.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenter.name;

    let depto = "";

    if (!regionalCenterName) {
      regionalCenterName = userData.teacherDepartments.find(item => 
        item.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenter.name
      )?.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenter.name;

      depto = userData.teacherDepartments.find(item => 
        item.regionalCenterFacultyCareerDepartment.Departament.name
      )?.regionalCenterFacultyCareerDepartment.Departament.name || "";
    }

    const simplifiedData = {
      userId: userData.id,
      dni: userData.person.dni,
      firstName: userData.person.firstName,
      midleName: userData.person.middleName,
      lastName: userData.person.lastName,
      secondLastName: userData.person.secondLastName,
      email: userData.person.email,
      phone: userData.person.phoneNumber,
      identificationCode: userData.identificationCode,
      institutionalEmail: userData.institutionalEmail,
      regionalCenter: regionalCenterName,
      avatar: avatarUrl,
      active: userData.active,
      role: userData.role.name,
      depto: depto || null,
      carrers: userData.carrers.map(career => ({
        id: career.regionalCenter_Faculty_Career.career.id,
        name: career.regionalCenter_Faculty_Career.career.name,
      })),
      images: userData.images
        .filter(image => !image.avatar)  // Filtrar los que no son avatar
        .map(image => ({
          id: image.idImage,
          url: image.url,
        })),
    };

    res.status(200).json(simplifiedData);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

