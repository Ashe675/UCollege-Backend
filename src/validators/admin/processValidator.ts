// src/validators/admin/processValidator.ts
import { body  } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError';

export const createProcessValidator = [
  body('startDate').isISO8601().withMessage('startDate must be a valid date'),
  body('finalDate').isISO8601().withMessage('finalDate must be a valid date'),
  body('processTypeId').isInt().withMessage('processTypeId must be an integer'),
  handleInputErrors,
];

//Validar el de desactivar y activar 
export const processIdValidator = [
    body('id').isInt().withMessage('id must be an integer'),
    handleInputErrors,
  ];
  
export const finalDateValidator = [
    body('id').isInt().withMessage('id must be an integer'),
    body('finalDate').isISO8601().withMessage('finalDate must be a valid date'),
    handleInputErrors,
  ];
