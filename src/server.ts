import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';
import { Server } from 'socket.io'
import { createServer } from 'node:http'

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
import solicitudesRoutes from './routes/solicitudes/solcitudesRoutes'

import enrollStudentRoutes from './routes/enrollStudent/enrollStudentRoutes'

import coordinatorRoutes from './routes/coordinator/coordinatorRoutes'

import chatRoutes from './routes/chat/chatRoutes'

import studentRoute from './routes/student/studentRoutes'

import { corsConfig } from './config/cors';
import { authenticateSocket } from './middleware/auth/auth';
import { handleEvents } from './middleware/chat/events';


dotenv.config()
connectDB()
startCronJobs()
scheduleProcessVerification()

const app = express()

const server = createServer(app)

export const io: Server = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL],
        methods: ['GET', 'POST']
    }
})

io.use(authenticateSocket);

io.on('connection', (socket) => {
    console.log("New socket connection:", socket.id);
    console.log("Authenticated user:", socket.data.user);
    handleEvents(socket)
})

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
app.use('/api/solicitudes', solicitudesRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/enroll-student', enrollStudentRoutes);
app.use('/api/user', userRoutes);

app.use('/api/coordinator', coordinatorRoutes);

app.use('/api/student', studentRoute);


app.use('/api/chat', chatRoutes)

export { server }