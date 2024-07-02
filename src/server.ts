import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';
import uploadRouter from './routes/uploadRoutes'

dotenv.config()

connectDB()

const app = express()

// Habilitando el cors
app.use(cors())

// Logueando las peticiones
app.use(morgan('dev'))

// leer datos de formularios
app.use(express.json())



app.use('/api/upload',uploadRouter)

export default app