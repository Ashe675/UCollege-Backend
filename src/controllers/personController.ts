// controllers/personController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPerson = async (req: Request, res: Response) => {
  try {
    const { dni, firstName, middleName, lastName, secondLastName, phoneNumber, email } = req.body;

    const createdPerson = await prisma.person.create({
      data: {
        dni,
        firstName,
        middleName,
        lastName,
        secondLastName,
        phoneNumber,
        email,
      },
    });

    res.status(201).json(createdPerson);
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Error creating person' });
  }
};

