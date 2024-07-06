import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';
import uploadRouter from './routes/admission/uploadRoutes'

import resultRoutes from './routes/admission/resultRoutes';
import careerRoutes from './routes/admission/careerRoutes';
import regionalCenterRoutes from './routes/admission/regionalCenterRoutes';
import admissionRoutes from './routes/admission/admissionRoutes'


dotenv.config()

connectDB()

const app = express()

// Habilitando el cors
app.use(cors())

// Logueando las peticiones
app.use(morgan('dev'))


// leer datos de formularios
app.use(express.json())
app.use('/api', resultRoutes);
app.use('/api', careerRoutes);
app.use('/api', regionalCenterRoutes);
app.use('/api', admissionRoutes);



app.use('/api/upload',uploadRouter)

export default app