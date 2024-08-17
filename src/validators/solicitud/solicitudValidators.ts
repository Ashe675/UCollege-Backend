import { body } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError'; // Ajusta el path según tu estructura de proyecto
import { NextFunction } from 'express';

export const ReposicionValidator = [
    body('justificacion')
        .isString().withMessage('Justificación debe ser una cadena de texto')
        .notEmpty().withMessage('Justificación es requerida')
        .isLength({ min: 1 }).withMessage('Justificación no puede estar vacía'),
    handleInputErrors,
];

export const RegionalCenterValidator = [
    body('justificacion')
        .isString().withMessage('Justificación debe ser una cadena de texto')
        .notEmpty().withMessage('Justificación es requerida')
        .isLength({ min: 1 }).withMessage('Justificación no puede estar vacía'),

    body('regionalCenterId')
        .isInt({ min: 1 }).withMessage('Regional Center ID debe ser un número entero positivo')
        .notEmpty().withMessage('Regional Center ID es requerido'),

    handleInputErrors,
];

export const validateSolicitudCambioCarrera = [
    body('justificacion')
        .isString().withMessage('La justificación debe ser una cadena de texto')
        .notEmpty().withMessage('La justificación es requerida')
        .isLength({ min: 10 }).withMessage('La justificación debe tener al menos 10 caracteres'),

    body('careerId')
        .isInt({ gt: 0 }).withMessage('careerId debe ser un número entero positivo')
        .notEmpty().withMessage('El careerId es requerido'),

    handleInputErrors,
];

export const validateSolicitudCancelacion = [
    body('justificacion')
        .isString().withMessage('La justificación debe ser una cadena de texto')
        .notEmpty().withMessage('La justificación es requerida')
        .isLength({ min: 10 }).withMessage('La justificación debe tener al menos 10 caracteres'),

    body('sectionIds')
        .custom(value => {
            // Verificar que `sectionIds` es una cadena
            if (typeof value !== 'string') {
                throw new Error('sectionIds debe ser una cadena de texto');
            }

            // Separar los IDs por coma y validar que cada ID sea un número entero positivo
            const ids = value.split(',').map(id => id.trim());
            if (ids.length === 0) {
                throw new Error('Al menos un sectionId debe ser proporcionado');
            }

            const invalidIds = ids.filter(id => !Number.isInteger(Number(id)) || Number(id) <= 0);
            if (invalidIds.length > 0) {
                throw new Error(`Los siguientes sectionIds son inválidos: ${invalidIds.join(', ')}`);
            }

            return true;
        })
        .withMessage('Los sectionIds deben ser números enteros positivos separados por comas'),

    handleInputErrors,
];