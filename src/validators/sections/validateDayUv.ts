import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db";

export const validateDayUv = async (req: Request, res: Response, next: NextFunction) => {
  const { IH, FH, days, classId } = req.body;

  try {
    // Validar parámetros
    if (IH < 0 || IH > 24 || FH < 0 || FH > 24) {
      return res.status(400).json({
        error: 'Las horas de inicio y finalización deben estar entre 0 y 24.',
      });
    }

    if (FH <= IH) {
      return res.status(400).json({
        error: 'La hora de finalización debe ser mayor que la hora de inicio.',
      });
    }

    // Calcular el total de horas diarias
    const dailyHours = FH - IH;
    const totalHours = dailyHours * days.length;

    // Obtener las UV de la clase
    const classData = await prisma.class.findUnique({
        where: { id: classId, active: true }
      });
  
      if (!classData) {
        return res.status(404).json({
          error: `No se encontró una clase activa con el ID proporcionado (${classId}).`,
        });
      }
  
      const { UV: uvClass } = classData;
  

    // Comparar con la cuota
    if (totalHours !== uvClass) {
      return res.status(400).json({
        error: `El total de horas (${totalHours}) no coincide con las unidades valorativas de la clase (${uvClass}).`,
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Error al validar las horas diarias.',
    });
  }
};
