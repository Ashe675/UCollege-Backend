import express from 'express';
import InscriptionController, { getInscriptionDetails } from '../../controllers/admission/inscriptionController';
import upload from '../../middleware/admission/upload'; 
import InscriptionValidator  from '../../middleware/admission/DataInscriptionValidator';
import {validateProcess} from '../../middleware/admission/isActiveProcess'
import {getActiveProcess} from '../../middleware/admission/getActiveProcess'
import { Request, Response, NextFunction } from 'express-serve-static-core';
import { param } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError';
import { checkActiveInscriptionProcess } from '../../middleware/admission/checkActiveResultProcess';

const router = express.Router();
const inscriptionController = new InscriptionController();


/**
 * Para hacer una petición POST al servicio de registro, sigue estos pasos:
 * 
 * URL: http://localhost:4000/api/inscriptions/register
 * Método: POST
 * Tipo de cuerpo: form-data
 * Contenido del cuerpo:
 * - principalCareerId:   number (ej. 2)
 * - secondaryCareerId:   number (ej. 3)
 * - personId:            number (ej. 1)
 * - regionalCenterId:    number
 * - photoCertificate:    file (ej. 'WhatsApp Image 2023-10-29 at 1.50.07 PM.jpeg')
 * - dni:                 string (ej. '0804596512126')
 * - firstName:           string  (ej. 'Carlos')
 * - middleName:          string (ej. 'Jose')
 * - lastName:            string (ej. 'Gallo')
 * - secondLastName:      string (ej. 'C')
 * - phoneNumber:         string (ej. '95957802')
 * - email:               string (ej. 'm.funcz03@example.com')
 */


router.post('/register', 
  upload.single('photoCertificate'), 
  (req : Request, res : Response, next : NextFunction) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere el certificado de foto y debe ser una imagen.' });
    }
    next();
  },
  getActiveProcess,
  ...InscriptionValidator.validatePerson(),
  validateProcess,
  
  (req : Request, res : Response) => inscriptionController.register(req, res)
);

router.get('/obtener/admitidos/CSV',
  (req : Request, res : Response) => inscriptionController.getAproveCSV(req, res)
);

router.get('/admission/inscription/:dni', [
  param('dni')
    .notEmpty().withMessage('DNI is required')
    .isLength({ min: 13, max: 13 }).withMessage('DNI must be 13 digits long')
],handleInputErrors, checkActiveInscriptionProcess,getInscriptionDetails);

export default router;
