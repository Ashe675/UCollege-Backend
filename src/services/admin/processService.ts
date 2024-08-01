// src/services/admin/processService.ts
import { prisma } from "../../config/db"
import { isInRangeDate } from "./enrollmentService";


type ProcessData = {
  startDate: Date;
  finalDate: Date;
  processTypeId: number;
  processId?: number;
}

export const createProcess = async (data: ProcessData) => {

  let { processTypeId, ...restData } = data;
  processTypeId = +processTypeId;

  if (new Date(restData.startDate) < new Date()) {
    throw new Error('La fecha inicial debe de ser mayor o igual a la actual.')
  }

  if (restData.startDate === restData.finalDate) {
    throw new Error('La fecha inicial debe de ser distinta a la fecha final.')
  }


  // Validar que no haya procesos superpuestos activos para el mismo tipo de proceso
  const overlappingProcesses = await prisma.process.findMany({
    where: {
      processTypeId,
      OR: [
        { active: true },
        {
          startDate: { lte: new Date(restData.finalDate) },
          finalDate: { gte: new Date(restData.startDate) }
        },
        {
          startDate: { gte: new Date(restData.startDate) },
          finalDate: { lte: new Date(restData.finalDate) }
        },
        {
          startDate: { lte: new Date(restData.finalDate) },
          finalDate: { gte: new Date(restData.finalDate) }
        }
      ]
    }
  });

  if (overlappingProcesses.length > 0) {
    throw new Error('Ya existe un proceso activo o se encontraron procesos superpuestos.');
  }

  const isInrage = isInRangeDate(new Date(restData.startDate), new Date(restData.finalDate));
  let activeValue = true;

  if (!isInrage) {
    activeValue = false;
  }

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

  if (processTypeId === 4) {
    const lastAcademicPeriodProcess = await prisma.process.findFirst({
      where: {
        processTypeId: 5,
        active: true,
        startDate: {
          lte: new Date()
        },
        finalDate: {
          gte: new Date()
        }
      }
    })

    console.log(lastAcademicPeriodProcess)

    if (!lastAcademicPeriodProcess) {
      throw new Error('No se encontro ningún periodo activo.')
    }

    // Asignar el id del proceso del periodo encontrado al nuevo proceso
    restData.processId = lastAcademicPeriodProcess.id;
  }

  if (processTypeId === 5) {
    const currentYear = new Date().getFullYear();
    const numerop = await prisma.academicPeriod.count({
      where: {
        process: {
          startDate: {
            gte: new Date(`${currentYear}-01-01T00:00:00Z`),
            lt: new Date(`${currentYear + 1}-01-01T00:00:00Z`),
          },
        },
      },
    });
    if (numerop >= 3) {
      throw new Error("No se puede crear otro periodo academico");
    }

    // Crear el proceso
    const process = await prisma.process.create({
      data: {
        startDate: new Date(restData.startDate),
        finalDate: new Date(restData.finalDate),
        processId: restData.processId,
        processTypeId,
        active: activeValue,
      },
    });

    await prisma.academicPeriod.create({
      data: {
        number: numerop + 1,
        processId: process.id
      }
    });

    return process
  }

  // Crear el proceso
  const process = await prisma.process.create({
    data: {
      startDate: new Date(restData.startDate),
      finalDate: new Date(restData.finalDate),
      processId: restData.processId,
      processTypeId,
      active: activeValue,
    },
  });


  return process;
};

export const activateProcess = async (id: number) => {
  const process = await prisma.process.updateMany({
    where: {
      OR: [{ processId: id }, { id }],
      startDate: {
        lte: new Date()
      },
      finalDate: {
        gte: new Date()
      }
    },
    data: { active: true },
  });
  return process;
};

export const deactivateProcess = async (id: number) => {
  const process = await prisma.process.updateMany({
    where: {
      OR: [{ processId: id }, { id }],
      startDate: {
        lte: new Date()
      },
      finalDate: {
        gte: new Date()
      }
    },
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
      orderBy: {
        id: 'desc'
      }
    }
  );
};

export const getAllActiveProcesses = async () => {
  return await prisma.process.findMany({
    where: {
      active: true,
      finalDate: {
        gte: new Date()
      }
    },
    include:
    {
      processType: {
        select: {
          name: true
        }
      }
    }, orderBy: {
      id: 'desc'
    }
  });
};

export const getAllProcessType = async () => {
  return await prisma.processType.findMany()
}

