import { Router } from 'express';
import { generateCsv, getInscriptionResults } from '../../controllers/admission/resultController';
import { param } from 'express-validator';
import handleInputErrors from '../../middleware/HandleInputError';
import { checkActiveResultsProcess } from "../../middleware/admission/checkActiveResultProcess";

const router = Router();

router.get('/admission/generate-csv', generateCsv);

router.get('/admission/viewresults/:dni',  [
    param('dni')
      .notEmpty().withMessage('DNI is required')
      .isLength({ min: 13, max: 13 }).withMessage('DNI must be 13 digits long')    
  ], checkActiveResultsProcess, handleInputErrors, getInscriptionResults);

export default router;
