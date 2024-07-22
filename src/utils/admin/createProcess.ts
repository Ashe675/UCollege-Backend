import { prisma } from "../../config/db";


interface CreateProcessInput {
  startDate: Date;
  finalDate: Date;
  active: boolean;
  processTypeId: number;
  processId?: number | null;
}

export const createProcess = async (data: CreateProcessInput) => {
  return await prisma.process.create({
    data: {
      startDate: data.startDate,
      finalDate: data.finalDate,
      active: data.active,
      processTypeId: data.processTypeId,
      processId: data.processId || null,
    },
  });
};
