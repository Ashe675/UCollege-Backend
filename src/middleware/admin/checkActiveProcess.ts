// src/middleware/admin/checkActiveProcess.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

export const checkActiveProcess = async (req: Request, res: Response, next: NextFunction) => {
  const { processTypeId, id, finalDate } = req.body;

  // Verificación para creación de procesos (POST)
  if (req.method === 'POST') {
    if (!processTypeId) {
      return res.status(400).json({ error: 'El id del tipo de proceso es requerido.' });
    }

    try {
      // Verificar si el processTypeId es válido
      const processType = await prisma.processType.findUnique({
        where: { id: processTypeId },
      });

      if (!processType) {
        return res.status(400).json({ error: `El tipo de proceso ${processTypeId} no existe.` });
      }

      // Verificar si ya hay un proceso activo del mismo tipo
      const activeProcess = await prisma.process.findFirst({
        where: {
          processTypeId: processTypeId,
          active: true,
        },
      });

      if (activeProcess) {
        return res.status(400).json({ error: `Un proceso de tipo ${activeProcess.processTypeId} ya se encuentra activo` });
      }

      next();
    } catch (error) {
      console.error('Error verificando proceso activo:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } 

  // Verificación para activar/desactivar procesos (PUT)
  else if (req.method === 'PUT') {
    if (!id) {
      return res.status(400).json({ error: 'El id del proceso es necesario' });
    }

    try {
      const process = await prisma.process.findUnique({
        where: { id },
      });

      if (!process) {
        return res.status(404).json({ error: 'Proceso no encontrado.' });
      }

      // Verificar la activación
      if (req.originalUrl.includes('/activate')) {
        if (process.active) {
          return res.status(400).json({ error: 'Este proceso ya se encuentra activo.' });
        }
        if (finalDate && new Date(finalDate) < new Date()) {
          return res.status(400).json({ error: 'Este proceso no se puede activar porque su fecha final ya expiro.' });
        }
      }

      // Verificar la desactivación
      if (req.originalUrl.includes('/deactivate')) {
        if (!process.active) {
          return res.status(400).json({ error: 'Este proceso ya se encuentra desactivado.' });
        }
      }
       // Verificación para actualizar la fecha final
       if (req.originalUrl.includes('/updateFinalDate')) {
        
        if (finalDate) {
          const finalDateParsed = new Date(finalDate);
          if (finalDateParsed < process.startDate ) {
            return res.status(400).json({ error: 'La fecha final no puede ser anterior a la fecha de inicio' });
          }
          if (!process.active) {
            return res.status(400).json({ error: 'No se puede modificar la fecha de un proceso inactivo.' });
          }
        }
      }

     

      next();
    } catch (error) {
      console.error('Error verificando el estado del proceso:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    next();
  }
};



