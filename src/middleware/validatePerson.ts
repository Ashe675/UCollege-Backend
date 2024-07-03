import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validatePerson = [
  body('dni')
    .isLength({ min: 13, max: 13 }).withMessage('DNI must be 13 characters long')
    .isString().withMessage('DNI must be a string'),
  body('firstName')
    .isString().withMessage('First name must be a string')
    .notEmpty().withMessage('First name is required'),
  body('middleName')
    .optional()
    .isString().withMessage('Middle name must be a string'),
  body('lastName')
    .isString().withMessage('Last name must be a string')
    .notEmpty().withMessage('Last name is required'),
  body('secondLastName')
    .optional()
    .isString().withMessage('Second last name must be a string'),
  body('phoneNumber')
    .isString().withMessage('Phone number must be a string')
    .notEmpty().withMessage('Phone number is required'),
  body('email')
    .isEmail().withMessage('Email must be a valid email address'),
  body('principalCareerId')
    .isInt({ gt: 0 }).withMessage('PrincipalCareerId must be a positive integer'),
  body('secondaryCareerId')
    .isInt({ gt: 0 }).withMessage('SecondaryCareerId must be a positive integer'),
  

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
