import express from 'express';
import InscriptionController from '../controllers/inscriptionController';
import upload from '../middleware/inscription/upload'; 
import InscriptionValidator  from '../middleware/inscription/validateInscription';

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
  InscriptionValidator.validatePerson,
  InscriptionValidator.validateUniquePerson,
  (req, res) => inscriptionController.register(req, res)
);

export default router;
