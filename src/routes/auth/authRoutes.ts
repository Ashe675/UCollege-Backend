import { Router } from "express";
import { AuthController } from "../../controllers/auth/authController";
import { AuthValidator } from "../../validators/auth/authValidator";
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
const router = Router()

router.post('/login', ...AuthValidator.validatorLogin(), AuthController.login)

router.post('/forgot-password', ...AuthValidator.validatorForgotPassword(), AuthController.forgotPassword)

router.get('/valid/:token', AuthController.userTokenExists)

router.post('/validate-token', ...AuthValidator.validatorValidateToken(), AuthController.validateToken)

router.post('/update-password/:token', ...AuthValidator.validatorUptdatePassword(), AuthController.updatePasswordWithToken)

router.get('/user',
    authenticate,
    AuthController.user
)

// //** Profile */

router.post('/update-password',
    authenticate,
    ...AuthValidator.validatorUpdateCurrentPassword(),
    AuthController.updateCurrentUserPassword
)

router.post('/update-password-teacher',
    authenticate,
    authorizeRole(['DEPARTMENT_HEAD']),
    ...AuthValidator.validatorForgotPasswordTeacher(),
    AuthController.forgotPasswordTeacher
)

router.post('/check-password',
    authenticate,
    ...AuthValidator.validatorCheckPassword(),
    AuthController.checkPassword
)


export default router