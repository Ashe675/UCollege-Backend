import express from 'express';
import InscriptionController from '../controllers/inscriptionController';
import upload from '../middleware/upload'; 
import InscriptionValidator  from '../middleware/DataInscriptionValidator';
import {validateProcess} from '../middleware/isActiveProcess'

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
 * - processId:           number 
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
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere el certificado de foto y debe ser una imagen.' });
    }
    next();
  },
  ...InscriptionValidator.validatePerson(),
  validateProcess,
  
  (req, res) => inscriptionController.register(req, res)
);

router.get('/optener/admitidos/CSV',
  (req, res) => inscriptionController.getAproveCSV(req, res)
);

export default router;
