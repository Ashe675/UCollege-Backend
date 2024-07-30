import { prisma } from "../../config/db";
import { DateTime } from 'luxon';

const validateDates = (startDate: Date, finalDate: Date) => {

  if (startDate >= finalDate) {
    throw new Error('La fecha inicial debe ser menor que la fecha final.');
  }
};

export const isInRangeDate = (startDate: Date, finalDate: Date): boolean => {
  const timeNow = DateTime.now().toUTC().toJSDate();
  return timeNow >= startDate && timeNow <= finalDate;
};

export const activateEnrollmentProcess = async (startDate: Date, finalDate: Date, processTypeId: number) => {
  try {
    const isInrage = isInRangeDate(startDate, finalDate);
    let activeValue = true;
    if (!isInrage) {
      activeValue = false;
    }
    // Validar fechas
    if (!startDate || !finalDate || isNaN(new Date(startDate).getTime()) || isNaN(new Date(finalDate).getTime())) {
      throw new Error('Fechas no válidas.');
    }

    // Validar que no haya procesos superpuestos activos para el mismo tipo de proceso
    const overlappingProcesses = await prisma.process.findMany({
      where: {
        processTypeId,
        active: true,
        OR: [
          {
            startDate: { lte: new Date(finalDate) },
            finalDate: { gte: new Date(startDate) }
          },
          {
            startDate: { gte: new Date(startDate) },
            finalDate: { lte: new Date(finalDate) }
          },
          {
            startDate: { lte: new Date(finalDate) },
            finalDate: { gte: new Date(finalDate) }
          }
        ]
      }
    });

    if (overlappingProcesses.length > 0) {
      throw new Error('Se encontraron procesos superpuestos.');
    }

    // Crear un nuevo proceso de matrícula
    const newProcess = await prisma.process.create({
      data: {
        startDate,
        finalDate,
        active: activeValue,
        processTypeId,
      },
    });

    return newProcess;
  } catch (error) {
    console.error('Error al activar el proceso de matrícula:', error);
    throw new Error('Error al activar el proceso de matrícula.');
  }
};

export const generateDayEnroll = async (processId: number, days: { startDate: Date, finalDate: Date, globalAvarage: number }[]) => {
  try {
    // Verificar si el proceso existe antes de crear los DayEnrolls
    const process = await prisma.process.findUnique({
      where: { id: processId }
    });

    if (!process) {
      throw new Error(`El proceso con ID ${processId} no existe.`);
    }

    // Crear los registros en la tabla DayEnroll
    const dayEnrolls = await prisma.dayEnroll.createMany({
      data: days.map(day => ({
        ...day,
        processId
      })),
      skipDuplicates: true // Omitir registros duplicados si existen
    });

    return dayEnrolls;
  } catch (error) {
    console.error('Error al generar los DayEnrolls:', error);
    throw new Error('Error al generar los DayEnrolls');
  }
};

