import { Router } from "express";
import { GradeController } from '../controllers/admissions/GradeController'
import multer from "multer";

const upload = multer()

const router = Router()

router.post('/grades',upload.single('grades'),GradeController.readGrades)

export default router