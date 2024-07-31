import { getUserDataController } from "../../controllers/user/userController";
import { Router } from 'express';
import { authenticate, authorizeRole } from "../../middleware/auth/auth";

const router = Router();
router.get('/user/:userId',
    authenticate,
    getUserDataController
  );

  export default router;