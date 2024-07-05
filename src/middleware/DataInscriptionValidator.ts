import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
//import { prisma } from '../config/db';

class DataInscription {
  static validateCareerIds() {
    return [
      body('principalCareerId')
        .isInt({ gt: 0 }).withMessage('PrincipalCareerId must be a positive integer')
        .toInt(),
      body('secondaryCareerId')
        .isInt({ gt: 0 }).withMessage('SecondaryCareerId must be a positive integer')
        .toInt(),
    ];
  }

  static validatePersonId() {
    return [
      body('personId')
        .isInt({ gt: 0 }).withMessage('PersonId must be a positive integer')
        .toInt(),
    ];
  }

  /**
 * Middleware para verificar los resultados de la validación de la solicitud.
 * 
 * Esta función realiza las siguientes acciones:
 * 1. Obtiene los errores de validación de la solicitud `req` usando `validationResult`.
 * 2. Si hay errores de validación, responde con un estado 400 (Bad Request) y un JSON que contiene los errores.
 * 3. Si no hay errores, llama a `next()` para pasar el control al siguiente middleware.
 * 
 * @param req - El objeto de solicitud (Request).
 * @param res - El objeto de respuesta (Response).
 * @param next - La función que se llama para pasar el control al siguiente middleware.
 */
  static checkValidationResult(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }

  static validatePerson() {
    
    return [
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
        DataInscription.validateCareerIds(),
        DataInscription.checkValidationResult,
        
        (req: Request, res: Response, next: NextFunction) => {
          
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }
          next();
        }
    ];
  }

  /**
   * 
  static async validateUniquePerson(req: Request, res: Response, next: NextFunction) {
    const { dni, phoneNumber, email } = req.body;
    
    try {
      const existingPerson = await prisma.person.findFirst({
        where: {
          OR: [
            { dni },
            { email },
          ],
        },
      });
      
      if (existingPerson) {
        return res.status(400).json({ error: 'Una persona con este DNI o correo electrónico ya existe en la base de datos.' });
      }
      
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }
  */
}

export default DataInscription;
