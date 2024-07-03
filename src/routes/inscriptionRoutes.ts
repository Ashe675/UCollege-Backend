import express from 'express';
import InscriptionController from '../controllers/inscriptionController';
import upload from '../middleware/inscription/upload'; 
import { validateInscription } from '../middleware/inscription/validateInscription';
import { validatePerson } from '../middleware/inscription/validatePerson';
import { validateUniquePerson } from '../middleware/inscription/validateUniquePerson';

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
  validateUniquePerson,
  (req, res) => inscriptionController.register(req, res)
);

export default router;
