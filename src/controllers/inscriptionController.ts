// controllers/inscriptionController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para generar una nota aleatoria entre 500 y 1800
const generateRandomScore = () => {
  return Math.floor(Math.random() * (1800 - 500 + 1)) + 500;
};

export const createInscription = async (req: Request, res: Response) => {
  try {
    const { principalCareerId, secondaryCareerId, photoCertificate, personId } = req.body;

    // Crear la inscripción
    const createdInscription = await prisma.inscription.create({
      data: {
        principalCareerId,
        secondaryCareerId,
        photoCertificate,
        personId,
      },
      include: {
        principalCareer: true,
        secondaryCareer: true,
        person: true,
        results: true,
      },
    });

    // Obtener los IDs de los exámenes de admisión asociados con la carrera principal
    const admissionTestCareers = await prisma.admissionTest_Career.findMany({
      where: {
        careerId: principalCareerId,
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

    // Generar resultados para los exámenes de admisión y almacenarlos en la tabla Result
    const results = await Promise.all(admissionTests.map(async (test) => {
      const score = generateRandomScore();
      let message = 'Reprobado';

      if (score >= (test.minScoreApprove || 0)) {
        message = 'Aprobado';
      }

      const result = await prisma.result.create({
        data: {
          inscriptionId: createdInscription.id,
          admissionTestId: test.id,
          score: score,
          message: message,
          date: new Date(),
        },
      });

      return result;
    }));

    res.status(201).json({
      inscription: createdInscription,
      admissionTests: admissionTests,
      results: results,
    });
  } catch (error) {
    console.error('Error creating inscription:', error);
    res.status(500).json({ error: 'Error creating inscription' });
  }
};




