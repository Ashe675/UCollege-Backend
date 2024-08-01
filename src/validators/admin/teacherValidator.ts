import { check } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError'

export const validateTeacher = [
    check('dni').isString().isLength({ min: 13, max: 13 }).withMessage('DNI must be 13 characters long'),
    check('firstName').isString().withMessage('First name is required'),
    check('lastName').isString().withMessage('Last name is required'),
    check('phoneNumber').isString().withMessage('Phone number is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('roleId').isInt().withMessage('El id del rol debe ser un entero'),
    check('regionalCenterId').isInt().withMessage('El id del centro regional debe ser entero'),
    check('departamentId').isInt().withMessage("el id del departamento debe ser entero"),
    handleInputErrors,
];

export const validateTeacherUpdate = [
    
    check('firstName').isString().withMessage('First name is required'),
    check('lastName').isString().withMessage('Last name is required'),
    check('phoneNumber').isString().withMessage('Phone number is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('roleId').isInt().withMessage('El id del rol debe ser un entero'),
    
    handleInputErrors,
]


export const validateChangeRegionalCenterData = [
    check('regionalCenterId')
        .isInt()
        .withMessage('El id del regional debe ser un entero positivo'),

    check('departamentId')
        .isInt()
        .withMessage('El id del departamento debe ser un entero positivo'),

    check('roleId')
        .isInt()
        .withMessage('El id del rol debe ser un entero positivo'),

    handleInputErrors,
];