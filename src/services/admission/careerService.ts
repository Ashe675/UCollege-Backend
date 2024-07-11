import { prisma } from "../../config/db";

const getAllCareers = async () => {
  return await prisma.career.findMany({
    select: {
      id: true,
      name: true,
    },
  });
};

module.exports = {
  getAllCareers,
};

