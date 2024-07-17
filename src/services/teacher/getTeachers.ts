import { prisma } from "../../config/db";

export const getAllTeachers = async () => {
    try {
      const teachers = await prisma.user.findMany({
        where: {
          roleId: 4, // Solo maestros
        },
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              secondLastName: true,
            },
          },
        },
      });
  
      // Formatear los resultados
      return teachers.map((teacher) => ({
        id: teacher.person.id,
        fullName: formatFullName(teacher.person),
      }));
    } catch (error) {
      throw new Error(`Error fetching teachers: ${error.message}`);
    }
  };
  
  // Función para formatear el nombre completo
  const formatFullName = (person) => {
    const { firstName, middleName, lastName, secondLastName } = person;
    return `${firstName} ${middleName ? middleName + ' ' : ''}${lastName} ${secondLastName ? secondLastName : ''}`.trim();
  };