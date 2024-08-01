import { prisma } from "../../config/db";
import { DateTime } from 'luxon';

export const validateDates = (startDate: Date, finalDate: Date) => {
  if (startDate < new Date()) {
    throw new Error('La fecha inicial debe de ser mayor o igual a la actual.')
  }

  if (startDate === finalDate) {
    throw new Error('La fecha inicial debe de ser distinta a la fecha final.')
  }

  if (startDate >= finalDate) {
    throw new Error('La fecha inicial debe ser menor que la fecha final.');
  }

};

export const isInRangeDate = (startDate: Date, finalDate: Date): boolean => {
  // Obtener la fecha actual en UTC
  const now = DateTime.now().toUTC()

  // Convertir startDate y finalDate a DateTime
  const start = DateTime.fromJSDate(startDate).toUTC()
  const end = DateTime.fromJSDate(finalDate).toUTC()
  
  // Verificar si la fecha actual está dentro del rango
  return now >= start && now <= end;
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

    validateDates(new Date(startDate), new Date(finalDate))

    // Validar que no haya procesos superpuestos activos para el mismo tipo de proceso
    const overlappingProcesses = await prisma.process.findMany({
      where: {
        processTypeId,
        OR: [
          {
            active: true
          },
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

    // obteniendo el Id del periodo academico
    const academicPeriod = await prisma.process.findFirst({
      where: { processTypeId : 5 , active: true, finalDate: { gte: new Date() }, startDate: { lte: new Date() } }
    })


    // Crear un nuevo proceso de matrícula
    const newProcess = await prisma.process.create({
      data: {
        startDate,
        finalDate,
        active: activeValue,
        processTypeId,
        processId : academicPeriod.id,
      },
    });

    return newProcess;
  } catch (error) {
    console.error('Error al activar el proceso de matrícula:', error);
    throw new Error(error.message);
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
        startDate : DateTime.fromJSDate(new Date(day.startDate)).toUTC().toJSDate(),
        finalDate : DateTime.fromJSDate(new Date(day.finalDate)).toUTC().toJSDate(),
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

