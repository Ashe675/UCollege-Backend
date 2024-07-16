import { body, param } from "express-validator";
import handleInputErrors from "../../middleware/HandleInputError";

export class AuthValidator {
    static validatorLogin() {
        return [
            body('institutionalEmail')
                .notEmpty().withMessage('Institutional Email is required'),
            body('password')
                .notEmpty().withMessage('Password is required'),
            handleInputErrors
        ];
    }

    static validatorForgotPassword() {
        return [
            body('institutionalEmail')
                .notEmpty().withMessage('Institutional Email is required'),
            handleInputErrors
        ]
    }

    static validatorValidateToken() {
        return [
            body('token')
                .notEmpty().withMessage('Token is required')
                .isLength({ min: 6 }).withMessage('Invalid Length Token'),
            handleInputErrors
        ]
    }

    static validatorUptdatePassword() {
        return [
            body('password')
                .isLength({ min: 8 }).withMessage('The password is short, minimum 8 characters.'),
            body('password_confirmation')
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Passwords are not the same ')
                    }
                    return true
                }),
            param('token')
                .notEmpty().withMessage('Token is required')
                .isNumeric().withMessage('Invalid Token')
                .isLength({ min: 6 }).withMessage('Invalid Length Token'),
            handleInputErrors
        ]
    }

    static validatorUpdateCurrentPassword() {
        return [
            body('current_password')
                .notEmpty().withMessage('Current password is required'),
            body('password')
                .isLength({ min: 8 }).withMessage('The password is short, minimum 8 characters.'),
            body('password_confirmation')
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Passwords are not the same ')
                    }
                    return true
                }),
            handleInputErrors
        ]
    }

    static validatorCheckPassword() {
        return [
            body('password')
            .notEmpty().withMessage('Password is required'), handleInputErrors
        ]
    }
} 