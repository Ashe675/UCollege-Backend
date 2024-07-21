import { body, param } from "express-validator";
import handleInputErrors from "../../middleware/HandleInputError";

export class EnrollValidator {

    static selectCareerValidator() {
        return [
            body('optionId')
                .notEmpty().withMessage('optionId is required')
                .isNumeric().withMessage('optionId must be a number'),
            handleInputErrors
        ]
    }
}