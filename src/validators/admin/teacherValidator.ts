import { check } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError'

export const validateTeacher = [
    check('dni').isString().isLength({ min: 13, max: 13 }).withMessage('DNI must be 13 characters long'),
    check('firstName').isString().withMessage('First name is required'),
    check('lastName').isString().withMessage('Last name is required'),
    check('phoneNumber').isString().withMessage('Phone number is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('institutionalEmail').isEmail().withMessage('Valid institutional email is required'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    check('roleId').isInt().withMessage('Role ID must be an integer'),
    // Add other necessary validations
    handleInputErrors,
];
