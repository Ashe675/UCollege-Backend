// src/services/admin/processService.ts
import { prisma } from "../../config/db"


type ProcessData ={
  startDate: Date;
  finalDate: Date;
  processTypeId: number;
  processId?: number;
}

export const createProcess = async (data: ProcessData) => {
  const process = await prisma.process.create({
    data: {
          ...data,
          active: true,
      }
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
