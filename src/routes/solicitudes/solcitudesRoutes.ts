import { Router } from 'express';
import { createSolicitudCambiodeCarreraController, createSolicitudCambiodeCentroController, createSolicitudCancelacionExcepcionalController, createSolicitudPagoReposicionController, getSolicitudesCambioCarreraController, getSolicitudesCambioCentroController, getSolicitudesCancelacionController } from '../../controllers/solcitudes/solicitudesController';
import { checkSolicitudPendCambioCarrera, checkSolicitudPendCancelacion } from "../../middleware/solicitudes/solicitudesMiddleware";
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
import multer from 'multer';
const upload = multer();
const router = Router();


router.get('/cancelaciones',authenticate, authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCancelacionController);
router.get('/carreras' ,authenticate,authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCambioCarreraController);
router.post('/cancelaciones',authenticate, authorizeRole([RoleEnum.STUDENT]), upload.array('files'), checkSolicitudPendCancelacion,createSolicitudCancelacionExcepcionalController);
router.post('/carreras',authenticate, authorizeRole([RoleEnum.STUDENT]), upload.array('files'), checkSolicitudPendCambioCarrera,createSolicitudCambiodeCarreraController);
router.post('/cambio-centro',authenticate, authorizeRole([RoleEnum.STUDENT]), upload.array('files'),createSolicitudCambiodeCentroController);
router.post('/pago-reposicion',authenticate, authorizeRole([RoleEnum.STUDENT]), upload.array('files'),createSolicitudPagoReposicionController);

export default router;