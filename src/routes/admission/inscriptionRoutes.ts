import express from 'express';
import { getInscriptionDetails } from '../../controllers/admission/inscriptionController';
import { param } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError';

const router = express.Router();

router.get('/admission/inscription/:dni', [
  param('dni')
    .notEmpty().withMessage('DNI is required')
    .isLength({ min: 13, max: 13 }).withMessage('DNI must be 13 digits long')
],handleInputErrors, getInscriptionDetails);

export default router;
