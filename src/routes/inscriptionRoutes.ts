import express from 'express';
import InscriptionController from '../controllers/inscriptionController';
import upload from '../middleware/upload'; 
import { validateInscription } from '../middleware/validateInscription';
import { validatePerson } from '../middleware/validatePerson';

const router = express.Router();
const inscriptionController = new InscriptionController();

router.post('/register', 
  upload.single('photoCertificate'), 
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'PhotoCertificate is required and must be an image' });
    }
    next();
  },
  validatePerson,
  inscriptionController.register
);

export default router;
