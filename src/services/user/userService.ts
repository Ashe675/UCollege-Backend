import { prisma } from "../../config/db";


export const getUserData = async (userId: number) => {
  // Obtener la información del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      identificationCode: true,
      personId: true,
      active: true,
      institutionalEmail: true,
      verified: true,
      description: true,
      person: true,
      images: true,
      role : {select: {name : true}}
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};