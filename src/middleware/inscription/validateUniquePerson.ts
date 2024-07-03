import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

export const validateUniquePerson = async (req: Request, res: Response, next: NextFunction) => {
  const { dni, phoneNumber, email } = req.body;

  try {
    const existingPerson = await prisma.person.findFirst({
      where: {
        OR: [
          { dni },
          { phoneNumber },
          { email },
        ],
      },
    });

    if (existingPerson) {
      return res.status(400).json({ error: 'Una persona con este DNI, número de teléfono o correo electrónico ya existe en la base de datos.' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
