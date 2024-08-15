import { Router } from 'express';
import { createSolicitudCancelacionExcepcionalController, getSolicitudesCambioCarreraController, getSolicitudesCambioCentroController, getSolicitudesCancelacionController } from '../../controllers/solcitudes/solicitudesController';
import { checkSolicitudPendCancelacion } from "../../middleware/solicitudes/solicitudesMiddleware";
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
const router = Router();

router.get('/cancelaciones' ,getSolicitudesCancelacionController);
router.get('/centros' ,getSolicitudesCambioCentroController);
router.get('/carreras' ,getSolicitudesCambioCarreraController);
router.get('/reposicion' ,getSolicitudesCambioCarreraController);
router.post('/cancelaciones',authenticate, checkSolicitudPendCancelacion,createSolicitudCancelacionExcepcionalController);

export default router;