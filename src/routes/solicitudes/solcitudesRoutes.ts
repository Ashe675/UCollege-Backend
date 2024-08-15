import { Router } from 'express';
import { createSolicitudCancelacionExcepcionalController, getSolicitudesCambioCarreraController, getSolicitudesCambioCentroController, getSolicitudesCancelacionController } from '../../controllers/solcitudes/solicitudesController';
import { checkSolicitudPendCancelacion } from "../../middleware/solicitudes/solicitudesMiddleware";
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
import multer from 'multer';
const upload = multer();
const router = Router();


router.get('/cancelaciones',authenticate, authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCancelacionController);
router.get('/carreras' ,authenticate,authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCambioCarreraController);
router.post('/cancelaciones',authenticate, authorizeRole([RoleEnum.STUDENT]), upload.array('files'), checkSolicitudPendCancelacion,createSolicitudCancelacionExcepcionalController);

export default router;