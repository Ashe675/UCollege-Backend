import { check } from 'express-validator';
import handleInputErrors from '../HandleInputError'


export const validateCodeIdentificationData = [
    check('identificationCode').isInt().withMessage('El código de identificación debe ser un entero'),
    handleInputErrors,
];