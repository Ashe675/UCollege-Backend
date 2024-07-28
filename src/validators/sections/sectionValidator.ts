// src/middlewares/validateSectionId.ts
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { sectionExists } from '../../services/sections/sectionService';
import { prisma } from '../../config/db';
import handleInputErrors from '../../middleware/HandleInputError';

export const validateSectionId = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID de sección inválido o faltante.' });
  }

  const exists = await sectionExists(Number(id));
  if (!exists) {
    return res.status(404).json({ error: 'Sección no encontrada.' });
  }

  next();
};

export const validateSectionCapacity = [
  body('increment')
    .isNumeric().withMessage('Increment must be a number')
    .notEmpty().withMessage('Increment is required'),
    handleInputErrors,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const createSectionValidators = [
  body('IH')
    .isInt({ min: 0, max: 23 }).withMessage('IH debe ser un número entero entre 0 y 23')
    .notEmpty().withMessage('IH es requerido'),
  body('FH')
    .isInt({ min: 0, max: 23 }).withMessage('FH debe ser un número entero entre 0 y 23')
    .notEmpty().withMessage('FH es requerido')
    .custom((value, { req }) => {
      if (value <= req.body.IH) {
        throw new Error('FH debe ser mayor que IH');
      }
      return true;
    }),
  body('classId')
    .isInt().withMessage('Class ID debe ser un entero')
    .notEmpty().withMessage('Class ID es requerido'),
  body('teacherId')
    .isInt().withMessage('Teacher ID debe ser un entero')
    .notEmpty().withMessage('Teacher ID es requerido'),
  body('classroomId')
    .isInt().withMessage('Classroom ID debe ser un entero')
    .notEmpty().withMessage('Classroom ID es requerido'),
  body('days')
    .isArray({ min: 1 }).withMessage('Days debe ser un arreglo con al menos un día')
    .custom((days) => {
      if (days.some(day => !Number.isInteger(day) || day < 1 || day > 7)) {
        throw new Error('Cada día debe ser un número entero entre 1 y 7');
      }
      return true;
    })
    .withMessage('Días son requeridos y deben ser números enteros entre 1 y 7'),
  handleInputErrors,
];

export const checkSectionExists = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;
  try {
    const existingSection = await prisma.section.findUnique({
      where: { code },
    });

    if (existingSection) {
      return res.status(400).json({ error: 'Una sección ya existe con ese mismo codigo' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server erroreeerr' });
  }
};

export const checkSectionExistsUpdate = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;
  const { id: sectionId } = req.params; // Obtén el ID de la sección desde los parámetros de la ruta
  
  try {
    // Verificar si ya existe una sección con el mismo código, excluyendo la sección actual
    const existingSection = await prisma.section.findFirst({
      where: {
        code,
        id: { not: Number(sectionId) }, // Excluir la sección actual de la validación
      },
    });

    if (existingSection) {
      return res.status(400).json({ error: 'Una sección ya existe con ese mismo código' });
    }

    next();
  } catch (error) {
    console.error('Error checking if section exists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};