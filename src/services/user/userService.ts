import { prisma } from "../../config/db";


export const getUserData = async (userId: number) => {
  // Obtener la información del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {person : true, images: true, role: {select : { name : true}}}
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};