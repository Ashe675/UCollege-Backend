import { body } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError';

export const activateEnrollmentValidator = [
  body('startDate').isISO8601().withMessage('startDate debe ser una fecha válida'),
  body('finalDate').isISO8601().withMessage('finalDate debe ser una fecha válida'),
  body('processTypeId').isInt().withMessage('processTypeId debe ser un número entero'),
  body('days').isArray().optional().withMessage('days debe ser un arreglo'),
  body('days.*.startDate').isISO8601().withMessage('startDate debe ser una fecha válida'),
  body('days.*.finalDate').isISO8601().withMessage('finalDate debe ser una fecha válida'),
  body('days.*.globalAvarage').isFloat().withMessage('globalAvarage debe ser un número'),

  handleInputErrors
];
