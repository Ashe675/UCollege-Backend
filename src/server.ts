import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';

import resultRoutes from './routes/resultRoutes';
import personRoutes from './routes/personRoutes';
import admissionRoutes from './routes/admissionRoutes';
import careerRoutes from './routes/careerRoutes';
import InscriptionRoutes from './routes/inscriptionRoutes';
import admissionTestRoutes from './routes/admissionTestRoutes';

dotenv.config()

connectDB()

const app = express()

// Habilitando el cors
app.use(cors())

// Logueando las peticiones
app.use(morgan('dev'))

// leer datos de formularios
app.use(express.json())
app.use('/results', resultRoutes);
app.use('/api', personRoutes);
app.use('/api', admissionRoutes);
app.use('/api', careerRoutes);
app.use('/api', InscriptionRoutes);
app.use('/api', admissionTestRoutes);

app.get('/', (req, res) => {
    res.send('Hello World')
})

export default app