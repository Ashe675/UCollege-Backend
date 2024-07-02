// controllers/admissionTestController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAdmissionTestsByCareer = async (req: Request, res: Response) => {
  try {
    const { careerId } = req.params;

    // Obtener los IDs de los exámenes de admisión asociados con la carrera
    const admissionTestCareers = await prisma.admissionTest_Career.findMany({
      where: {
        careerId: parseInt(careerId),
      },
      select: {
        admissionTestId: true,
      },
    });

    const admissionTestIds = admissionTestCareers.map(atc => atc.admissionTestId);

    // Obtener los detalles de los exámenes de admisión
    const admissionTests = await prisma.admissionTest.findMany({
      where: {
        id: {
          in: admissionTestIds,
        },
      },
    });

    res.status(200).json(admissionTests);
  } catch (error) {
    console.error('Error getting admission tests:', error);
    res.status(500).json({ error: 'Error getting admission tests' });
  }
};
