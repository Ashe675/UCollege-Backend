import { body, validationResult } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError'

// Middleware de validación
export const enrollStudentValidatorData = [
  
  body('sectionId')
    .isInt({ gt: 0 })
    .withMessage('sectionId debe ser un número entero positivo.'),
    handleInputErrors

  
];
