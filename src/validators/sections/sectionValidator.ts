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

export const validateSectionIdActive = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID de sección inválido o faltante.' });
  }

  const section = await prisma.section.findFirst({
    where:{id: Number(id), active: true}, 
  })
  if (!section) {
    return res.status(404).json({ error: 'La seccion no se encuentra activa.' });
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
        throw new Error('Hora final debe ser mayor que la Hora Inicial');
      }
      return true;
    }),
  body('classId')
    .isInt().withMessage('Class ID debe ser un entero')
    .notEmpty().withMessage('Class ID es requerido'),
  body('quota')
    .isInt().withMessage('Los cupos deben de ser un entero')
    .notEmpty().withMessage('Los cupos son requeridos'),
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

