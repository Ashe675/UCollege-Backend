import { check } from 'express-validator';
import handleInputErrors from '../HandleInputError';

export const validateSectionIdData = [
    check('sectionId')
        .isInt()
        .withMessage('El sectionId debe ser un número entero válido'),
    handleInputErrors,
];
