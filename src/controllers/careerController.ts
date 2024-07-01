// controllers/careerController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCareer = async (req: Request, res: Response) => {
  try {
    const { name, active, description, code } = req.body;

    const createdCareer = await prisma.career.create({
      data: {
        name,
        active,
        description,
        code,
      },
    });

    res.status(201).json(createdCareer);
  } catch (error) {
    console.error('Error creating career:', error);
    res.status(500).json({ error: 'Error creating career' });
  }
};
