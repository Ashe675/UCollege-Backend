// src/services/admin/processService.ts
import { prisma } from "../../config/db"


type ProcessData = {
  startDate: Date;
  finalDate: Date;
  processTypeId: number;
  processId?: number;
}

export const createProcess = async (data: ProcessData) => {

  let { processTypeId, ...restData } = data;
  processTypeId = +processTypeId;

  // Verificar si es un proceso de tipo "resultados" (id 2)
  if (processTypeId === 2) {
    // Buscar el último proceso de tipo "inscripción" (id 1) que esté activo
    const lastActiveInscriptionProcess = await prisma.process.findFirst({
      where: {
        processTypeId: 1,
        active: true,
      },
      orderBy: {
        id: 'desc', // Ordenar por id en orden descendente para obtener el último creado
      },
    });

    // Si no se encuentra un proceso de inscripción activo, retornar un error
    if (!lastActiveInscriptionProcess) {
      throw new Error('No se encontro ningún proceso de inscripción activo.')
    }

    // Verificar si ya existe un proceso de resultados asociado a este proceso de inscripción
    const existingResultProcess = await prisma.process.findFirst({
      where: {
        processTypeId: 2,
        processId: lastActiveInscriptionProcess.id,
      },
    });

    // Si ya existe un proceso de resultados asociado, retornar un error
    if (existingResultProcess) {
      throw new Error('Ya hay un proceso de resultados asociado al ultimo proceso de inscripción')
    }

    // Asignar el id del proceso de inscripción encontrado al nuevo proceso de resultados
    restData.processId = lastActiveInscriptionProcess.id;
  }

  // Crear el proceso
  const process = await prisma.process.create({
    data: {
      startDate:  new Date(restData.startDate),
      finalDate:  new Date(restData.finalDate),
      processId: restData.processId,
      processTypeId,
      active: true,
    },
  });

  return process;
};

export const activateProcess = async (id: number) => {
  const process = await prisma.process.update({
    where: { id },
    data: { active: true },
  });
  return process;
};

export const deactivateProcess = async (id: number) => {
  const process = await prisma.process.update({
    where: { id },
    data: { active: false },
  });
  return process;
};

export const updateFinalDate = async (id: number, finalDate: Date) => {
  const process = await prisma.process.update({
    where: { id },
    data: { finalDate },
  });
  return process;
};

export const getAllProcesses = async () => {
  return await prisma.process.findMany(
    {
      include:
      {
        processType: {
          select: {
            name: true
          }
        }
      },
      orderBy : {
        id : 'desc'
      }
    }
  );
};

export const getAllActiveProcesses = async () => {
  return await prisma.process.findMany({
    where: {
      active: true,
    },
    include:
    {
      processType: {
        select: {
          name: true
        }
      }
    }

  });
};

export const getAllProcessType = async () => {
  return await prisma.processType.findMany()
}
