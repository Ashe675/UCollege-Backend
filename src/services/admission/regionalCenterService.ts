// services/admissions/regionalCenterService.ts
import { prisma } from "../../config/db";

export const getRegionalCenters = async () => {
  return await prisma.regionalCenter.findMany(
    {
      select: {
        id: true,
        name: true,
        regionalCentersCareer: {
          select: {
            career: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
};

export const getRegionalCentersS = async () => {
  return await prisma.regionalCenter_Career.findMany(
    {
      select: {
        regionalCenter:{
          select:{
            id: true,
            name: true,
          },
        },
        career:{
          select:{
            id: true,
            name: true,
          },
        },
      },
    });
};




