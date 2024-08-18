import { Router } from 'express';
import { getTeachers } from '../../controllers/teachers/getTeachers';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
import { validateCodeIdentificationData } from '../../middleware/codeIdentification/validateCodeIdentificationData';
import { validateGradeData } from '../../middleware/teacher/validateGrade';
import { existSection } from '../../middleware/enrollStudent/existEntity';
import { validateTeacher } from '../../validators/admin/teacherValidator';
import { setGradeTeacher } from '../../controllers/student/valueTeacherController';
import { checkActiveProcessByTypeIdMiddleware } from '../../middleware/checkActiveProcessGeneric';
import { checkIsAccessToSeccion } from '../../middleware/section/sectionMiddleware';
import { validateSectionId } from '../../validators/sections/sectionValidator';
import { deleteAvatarStudent, deleteImageStudent, getAllGradeStudent, getGradeStudent, getStudentImages, uploadImageStudent } from '../../controllers/student/studentController';
import { upload } from '../../middleware/student/multerStudent';
import { validateImageFile } from '../../middleware/validateIsImage';

const route =  Router();

/**
 {
    grade: float,
    sectionId: number
 }
 */
route.post('/value-teacher/',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    checkActiveProcessByTypeIdMiddleware(4),
    validateGradeData,
    existSection,
    checkIsAccessToSeccion,
    setGradeTeacher,
);


route.get('/getGrade/:sectionId',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    checkActiveProcessByTypeIdMiddleware(4),
    checkActiveProcessByTypeIdMiddleware(5),
    existSection,
    getGradeStudent,
);

route.get('/getAllGrade',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    checkActiveProcessByTypeIdMiddleware(4),
    checkActiveProcessByTypeIdMiddleware(5),
    getAllGradeStudent,
);
/**
{
    avatar: true || false
    urlImage: file path
}
 */
route.post('/upload/image',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    validateImageFile,
    upload.single('image'),
    uploadImageStudent,
)

// route.post('/upload/profile-image',
//     authenticate,
//     authorizeRole([RoleEnum.STUDENT]),
//     upload.single('image'),
//     uploadImageStudent,
// )

route.delete('/delete/image/:imageId',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    deleteImageStudent,
);

route.delete('/delete/avatar',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    deleteAvatarStudent,
);

route.get('/getAllImage',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    getStudentImages
);



export default route;