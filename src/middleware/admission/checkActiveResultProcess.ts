import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db";
import { Process } from "@prisma/client";

declare global {
  namespace Express {
      interface Request {
          processResult? :  Process,
          processInscription? :  Process,
      }
  }
}


export const checkActiveResultsProcess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentDate = new Date();

    const activeResultsProcess = await prisma.process.findFirst({
      where: {
        processTypeId: 2, // ID del tipo de proceso para resultados
        active: true,
        startDate: {
          lte: currentDate, // startDate less than or equal to currentDate
        },
        finalDate: {
          gte: currentDate, // finalDate greater than or equal to currentDate
        }
      },
    });

    if (!activeResultsProcess) {
      return res.status(400).json({ error: 'El proceso de entrega de resultados no está activo.' });
    }
    req.processResult = activeResultsProcess;
    next();
  } catch (error) {
    console.error("Error checking active results process:", error);
    res.status(500).json({ error: 'Ocurrió un error al verificar el proceso de entrega de resultados.' });
  }
};

export const checkActiveInscriptionProcess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentDate = new Date();

    const activeInscriptionProcess = await prisma.process.findFirst({
      where: {
        processTypeId: 1, // ID del tipo de proceso para resultados
        active: true,
        startDate: {
          lte: currentDate, // startDate less than or equal to currentDate
        },
        finalDate: {
          gte: currentDate, // finalDate greater than or equal to currentDate
        }
      },
    });

    if (!activeInscriptionProcess) {
      return res.status(400).json({ error: 'El proceso de inscripción no está activo.' });
    }
    req.processInscription = activeInscriptionProcess;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al verificar el proceso de inscripción.' });
  }
};
