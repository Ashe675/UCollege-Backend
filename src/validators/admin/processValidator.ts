// src/validators/admin/processValidator.ts
import { body  } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import handleInputErrors from '../../middleware/HandleInputError';

export const createProcessValidator = [
  body('startDate').isISO8601().withMessage('startDate must be a valid date')
    .notEmpty().withMessage("Fecha de inicio requerida"),
  body('finalDate').isISO8601().withMessage('finalDate must be a valid date')
    .notEmpty().withMessage("Fecha final requerida"),
  body('processTypeId').isInt().withMessage('processTypeId must be an integer')
    .notEmpty().withMessage("Tipo de proceso requerido"),
  handleInputErrors,
];
//Validar el de desactivar y activar 
export const processIdValidator = [
    body('id').isInt().withMessage('id must be an integer')
      .notEmpty().withMessage("Id proceso requerido"),
    handleInputErrors,
  ];
  
export const finalDateValidator = [
    body('id').isInt().withMessage('id must be an integer')
      .notEmpty().withMessage("Id proceso requerido"),
    body('finalDate').isISO8601().withMessage('finalDate must be a valid date')
      .notEmpty().withMessage("Fecha final requerida"),
    handleInputErrors,
  ];
