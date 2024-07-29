import { Request, Response, NextFunction } from 'express';
import { prisma } from "../config/db";

export const checkActiveProcessPeriod = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const process = await checkActiveProcessByTypeId(5);

        if(!process){
            return res.status(400).json({ error: 'No hay un periodo academico activo' });
        }
        req.body.processAcademicPeriod = process;
        next();
      } catch (error) {
        res.status(500).json({ error: 'Internal server erroree' });
      }

};

export const checkActiveProcesMatricula = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const process = await checkActiveProcessByTypeId(3);

        if(!process){
            return res.status(400).json({ error: 'No hay un proceso de matricula activo' });
        }

        next();
      } catch (error) {
        res.status(500).json({ error: 'Internal server erroree' });
      }

};

export const checkActiveProcessByTypeId = async (processTypeId: number) =>{
    return await prisma.process.findFirst({
        where: { processTypeId, active: true, finalDate : {gte: new Date()}, startDate : {lte:  new Date()}}, 
    })
    
} 