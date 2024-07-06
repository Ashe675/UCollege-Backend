import express from 'express';
import { getInscriptionDetails } from '../../controllers/admission/inscriptionController';
import { param } from 'express-validator';

const router = express.Router();

router.get('/inscription/:dni', [
    param('dni')
      .notEmpty().withMessage('DNI es necesario')
      .isLength({ min: 13, max: 13 }).withMessage('DNI tiene que tener 13 digitos')
      .isNumeric().withMessage('DNI tiene que ser numerico')
  ], getInscriptionDetails);

export default router;
