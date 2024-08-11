import { check } from 'express-validator';
import handleInputErrors from '../HandleInputError'


export const validateObsData = [
    check('obs')
        .isIn(['APR', 'REP', 'ABD', 'NSP'])
        .withMessage('El valor de "obs" debe ser uno de los siguientes: APR, REP, ABD, NSP'),
    handleInputErrors,
];
