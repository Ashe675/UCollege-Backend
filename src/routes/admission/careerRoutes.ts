import { Router } from 'express';
const careerController = require('../../controllers/admission/careerController');

const router = Router();

router.get('/careers', careerController.getAllCareers);

export default router;
