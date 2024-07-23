import { check } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError'

export const validateTeacher = [
    check('dni').isString().isLength({ min: 13, max: 13 }).withMessage('DNI must be 13 characters long'),
    check('firstName').isString().withMessage('First name is required'),
    check('lastName').isString().withMessage('Last name is required'),
    check('phoneNumber').isString().withMessage('Phone number is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('RegionalCenter_Faculty_Career_id').isInt().withMessage('El id del centro regional faculta carrera debe ser entero'),
    
    handleInputErrors,
];
