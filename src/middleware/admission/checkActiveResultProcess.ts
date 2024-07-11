import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db";

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
    req.body.resultIdActive = activeResultsProcess.id;
    next();
  } catch (error) {
    console.error("Error checking active results process:", error);
    res.status(500).json({ error: 'Ocurrió un error al verificar el proceso de entrega de resultados.' });
  }
};

