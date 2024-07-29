import { body } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError';

export const activateEnrollmentValidator = [
  body('startDate').isISO8601({ strict: true }).withMessage('startDate debe ser una fecha válida con hora'),
  body('finalDate').isISO8601({ strict: true }).withMessage('finalDate debe ser una fecha válida con hora'),
  body('processTypeId').isInt().withMessage('processTypeId debe ser un número entero'),
  body('days').isArray().optional().withMessage('days debe ser un arreglo'),
  body('days.*.startDate').isISO8601({ strict: true }).withMessage('days.*.startDate debe ser una fecha válida con hora'),
  body('days.*.finalDate').isISO8601({ strict: true }).withMessage('days.*.finalDate debe ser una fecha válida con hora'),
  body('days.*.globalAvarage').isFloat().withMessage('globalAvarage debe ser un número'),

  handleInputErrors
];
