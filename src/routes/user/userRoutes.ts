import { getProfile, getUserDataController } from "../../controllers/user/userController";
import { Router } from 'express';
import { authenticate, authorizeRole } from "../../middleware/auth/auth";
import { RoleEnum } from "@prisma/client";

const router = Router();
router.get('/:userId',
    authenticate,
    getUserDataController
  );


router.get('/get-profile/:userId',
        authenticate,
        authorizeRole([RoleEnum.ADMIN,RoleEnum.COORDINATOR,RoleEnum.DEPARTMENT_HEAD,RoleEnum.STUDENT,RoleEnum.TEACHER]),
        getProfile
)
  export default router;