import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateInscription = [
  body('principalCareerId')
    .isInt({ gt: 0 }).withMessage('PrincipalCareerId must be a positive integer')
    .toInt(),
  body('secondaryCareerId')
    .isInt({ gt: 0 }).withMessage('SecondaryCareerId must be a positive integer')
    .toInt(),
  body('personId')
    .isInt({ gt: 0 }).withMessage('PersonId must be a positive integer')
    .toInt(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

