// controllers/admissionController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAdmission = async (req: Request, res: Response) => {
  try {
    const { principalCareerId, secondaryCareerId, photoCertificate, date, personId } = req.body;

    const createdAdmission = await prisma.inscription.create({
      data: {
        principalCareerId,
        secondaryCareerId,
        photoCertificate,
        date,
        personId,
      },
    });

    res.status(201).json(createdAdmission);
  } catch (error) {
    console.error('Error creating admission:', error);
    res.status(500).json({ error: 'Error creating admission' });
  }
};
