import { Request, Response, NextFunction } from 'express';
import { prisma } from "../config/db";
import { capitalizeWords } from '../utils/strings/stringUtilities';

export const checkActiveProcessPeriod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const process = await checkActiveProcessByTypeId(5);

    if (!process) {
      return res.status(400).json({ error: 'No hay un periodo academico activo' });
    }
    req.body.processAcademicPeriod = process;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }

};

export const checkActiveProcesMatricula = async (req: Request, res: Response, next: NextFunction) => {

  try {
    const process = await checkActiveProcessByTypeId(3);

    if (!process) {
      return res.status(400).json({ error: 'No hay un proceso de matricula activo' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server erroree' });
  }

};

export const checkActiveProcessByTypeId = async (processTypeId: number) => {
  return await prisma.process.findFirst({
    where: { processTypeId, active: true, finalDate: { gte: new Date() }, startDate: { lte: new Date() } },
    include: { processType: true, academicPeriod: true, inscriptions: true, parentProcess: true, results: true, subprocesses: true, daysEnrolls: true, planning: true }
  })
}

export const checkActiveProcessByTypeId2 = (processTypeId: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tipoProceso = await prisma.processType.findFirst({
      where:{id: processTypeId},
      select:{name:true}
    })
    try {
      const activeProcess = await prisma.process.findFirst({
        where: { 
          processTypeId, 
          active: true, 
          finalDate: { gte: new Date() }, 
          startDate: { lte: new Date() } 
        },
        include: { 
          processType: true, 
          academicPeriod: true, 
          inscriptions: true, 
          parentProcess: true, 
          results: true, 
          subprocesses: true, 
          daysEnrolls: true, 
          planning: true 
        }
      });

      if (!activeProcess) {
        return res.status(404).json({ error: `No hay un proceso de ${tipoProceso.name} activo` });
      }

      // Si el proceso activo existe, pasamos al siguiente middleware o ruta
      next();
    } catch (error) {
      // Manejo de errores
      console.error('Error checking active process:', error);
      res.status(500).json({ error: 'An error occurred while checking the active process.' });
    }
  };
};

export const checkActiveProcessByTypeIdMiddleware = (processTypeId: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const process = await checkActiveProcessByTypeId(processTypeId);
      if (!process) {
        const processType = await prisma.processType.findUnique({ where: { id: processTypeId } })
        return res.status(400).json({ error: `No hay un proceso de ${processType.name} activo` });
      }

      // creo una variable para el body donde, ejemplo : req.body.academicPeriod
      const nameParam = "process" + capitalizeWords(process.processType.name.toLocaleLowerCase()).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

      req.body[nameParam] = process

      next();
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Server Internal Error' })
    }
  };
};


export const checkActiveProcessesByTypeIdMiddlewareOR= (processTypeIdList : number[] ) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const process = await prisma.process.findFirst({
        where: { processTypeId : { in  : processTypeIdList }, active: true, finalDate: { gte: new Date() }, startDate: { lte: new Date() } },
        include: { processType: true, academicPeriod: true, inscriptions: true, parentProcess: true, results: true, subprocesses: true, daysEnrolls: true, planning: true }
      })

      if (!process) {
        return res.status(400).json({ error: `No hay un proceso activo necesario para realizar esta acción.` });
      }

      // creo una variable para el body donde, ejemplo : req.body.academicPeriod
      const nameParam = "process" + capitalizeWords(process.processType.name.toLocaleLowerCase()).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

      req.body[nameParam] = process

      next();
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Server Internal Error' })
    }
  };
};