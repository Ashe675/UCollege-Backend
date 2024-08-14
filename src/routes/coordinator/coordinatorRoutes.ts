import express from 'express';
import { RoleEnum } from '@prisma/client';

//middleware
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import {validateCodeIdentificationData} from '../../middleware/codeIdentification/validateCodeIdentificationData'
import { exportExcel, exportPdf } from '../../controllers/coordinator/exportAcademicLoadController';

//controllers



const router = express.Router();

router.get('/get-academicLoad/export/excel',
            authenticate,
            authorizeRole([RoleEnum.COORDINATOR]),
            exportExcel
);

router.get('/get-academicLoad/export/pdf',
    authenticate,
    authorizeRole([RoleEnum.COORDINATOR]),
    exportPdf
);


export default router;