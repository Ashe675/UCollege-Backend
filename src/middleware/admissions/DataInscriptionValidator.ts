import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
//import { prisma } from '../config/db';


class DataInscription {
  static validateCareerIds() {
    return [
      body('principalCareerId')
        .isInt({ gt: 0 }).withMessage('PrincipalCareerId debe ser un entero positivo')
        .toInt(),
      body('secondaryCareerId')
        .isInt({ gt: 0 }).withMessage('SecondaryCareerId debe ser un entero positivo')
        .toInt(),
    ];
  }

  static validatePersonId() {
    return [
      body('personId')
        .isInt({ gt: 0 }).withMessage('PersonId debe ser un entero positivo')
        .toInt(),
    ];
  }
  
  static validateProcessId() {
    return [
      body('processId')
        .isInt({ gt: 0 }).withMessage('ProcessId debe ser un entero positivo')
        .toInt(),
    ];
  }

  static validateRegionId() {
    return [
      body('regionalCenterId')
        .isInt({ gt: 0 }).withMessage('ProcessId debe ser un entero positivo')
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


  /**
 * Middleware para validar los datos de una persona en una solicitud HTTP.
 * 
 * Esta función realiza las siguientes validaciones en los campos del cuerpo de la solicitud:
 * 
 * 1. **DNI**:
 *    - Debe tener exactamente 13 caracteres.
 *    - Debe ser una cadena de texto.
 * 
 * 2. **Nombre**:
 *    - `firstName`: Debe ser una cadena de texto y no puede estar vacío.
 *    - `middleName`: Opcional, pero si se proporciona, debe ser una cadena de texto.
 *    - `lastName`: Debe ser una cadena de texto y no puede estar vacío.
 *    - `secondLastName`: Opcional, pero si se proporciona, debe ser una cadena de texto.
 * 
 * 3. **Número de teléfono**:
 *    - Debe ser una cadena de texto y no puede estar vacío.
 * 
 * 4. **Correo electrónico**:
 *    - Debe ser una dirección de correo electrónico válida.
 * 
 * 5. **Validaciones adicionales**:
 *    - `DataInscription.validateCareerIds()`: Valida los IDs de las carreras.
 *    - `DataInscription.checkValidationResult`: Verifica los resultados de la validación.
 * 
 * 6. **Manejo de errores**:
 *    - Si hay errores de validación, responde con un estado 400 (Bad Request) y un JSON que contiene los errores.
 *    - Si no hay errores, llama a `next()` para pasar el control al siguiente middleware.
 * 
 * @returns Un array de middlewares de validación.
 */
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
        //DataInscription.validatePersonId(),
        DataInscription.validateRegionId(),
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

}

export default DataInscription;
