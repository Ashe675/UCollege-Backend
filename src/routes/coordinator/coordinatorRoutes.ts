import express from 'express';
import { RoleEnum } from '@prisma/client';

//middleware
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import {validateCodeIdentificationData} from '../../middleware/codeIdentification/validateCodeIdentificationData'

//controllers



const router = express.Router();

router.post('/get-academicLoad/export/excel',
            authenticate,
            authorizeRole([RoleEnum.COORDINATOR]),

)

export default router;