import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createObjectCsvWriter } from 'csv-writer';

const prisma = new PrismaClient();

const generateRandomScore = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateCsv = async (req: Request, res: Response) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).send('Date query parameter is required');
  }

  try {
    // Buscar todas las inscripciones de la fecha proporcionada
    const inscriptions = await prisma.inscription.findMany({
      where: {
        date: new Date(date as string),
      },
      include: {
        person: true,
        principalCareer: {
          include: {
            admissionsTests: {
              include: {
                admissionTest: true,
              },
            },
          },
        },
        secondaryCareer: {
          include: {
            admissionsTests: {
              include: {
                admissionTest: true,
              },
            },
          },
        },
      },
    });

    if (!inscriptions.length) {
      return res.status(404).send('No inscriptions found for the given date.');
    }

    const records = [];

    // Generar las notas aleatorias y preparar los registros para el CSV
    for (const inscription of inscriptions) {
      const careers = [
        ...inscription.principalCareer.admissionsTests,
        ...inscription.secondaryCareer.admissionsTests,
      ];

      for (const admissionTestCareer of careers) {
        const score = generateRandomScore(
          0,
          Math.ceil(admissionTestCareer.admissionTest.score)
        );

        records.push({
          dni: inscription.person.dni,
          exam: admissionTestCareer.admissionTest.code,
          score,
        });
      }
    }

    const csvWriter = createObjectCsvWriter({
      path: 'results.csv',
      header: [
        { id: 'score', title: 'Nota' },
        { id: 'exam', title: 'Examen' },
        { id: 'dni', title: 'DNI' },
      ],
    });

    await csvWriter.writeRecords(records);

    res.download('results.csv');
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).send('Internal Server Error');
  }
};


