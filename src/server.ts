import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';
import { startCronJobs } from './utils/auth/cronToken';
import { scheduleProcessVerification } from './utils/jobs/desactiveProcess'

import inscriptionRoutes from './routes/admission/inscriptionRoutes';
import uploadRouter from './routes/admission/uploadRoutes'

import resultRoutes from './routes/admission/resultRoutes';
import careerRoutes from './routes/admission/careerRoutes';
import regionalCenterRoutes from './routes/admission/regionalCenterRoutes';
import admissionRoutes from './routes/admission/admissionRoutes'
import inscriptionsByDni from './routes/admission/inscriptionRoutes';
import teacherRoutes from './routes/teachers/teachersRoutes';
import enrollRoutes from './routes/enroll/enrollRoutes'
import processRoutes from './routes/admin/adminRoutes';
import sectionRoutes from './routes/sections/sectionRoutes';
import departmentHeadRoutes from './routes/departmentHead/departmentHeadRoutes';
import userRoutes from "./routes/user/userRoutes";
import authRoutes from './routes/auth/authRoutes';
import adminRoutes from './routes/admin/adminRoutes';
import statisticsRoutes from './routes/statistics/statisticsRoutes';

import enrollStudentRoutes from './routes/enrollStudent/enrollStudentRoutes'

import coordinatorRoutes from './routes/coordinator/coordinatorRoutes'

import { corsConfig } from './config/cors';


dotenv.config()
connectDB()
startCronJobs()
scheduleProcessVerification()

const app = express()

// Habilitando el cors
app.use(cors(corsConfig))

// Logueando las peticiones
app.use(morgan('dev'))


// leer datos de formularios
app.use(express.json())
app.use('/api', resultRoutes);
app.use('/api', careerRoutes);
app.use('/api', regionalCenterRoutes);
app.use('/api', admissionRoutes);
app.use('/api', inscriptionsByDni);
app.use('/api/upload', uploadRouter)
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/enroll', enrollRoutes);
app.use('/api/section', sectionRoutes);
app.use('/api/department-head', departmentHeadRoutes);

app.use('/api/statistics', statisticsRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/enroll-student', enrollStudentRoutes);
app.use('/api/user', userRoutes);

app.use('/api/coordinator', coordinatorRoutes)

export default app