import { check } from 'express-validator';
import handleInputErrors from '../HandleInputError';

export const validateGradeData = [
    check('grade')
        .isFloat({ min: 0, max: 100 })
        .withMessage('La calificación (grade) debe ser un número decimal entre 0 y 100'),
    handleInputErrors,
];
