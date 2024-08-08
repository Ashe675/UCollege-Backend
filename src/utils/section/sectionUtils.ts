import { prisma } from '../../config/db'; // Asegúrate de que la ruta sea correcta
export const getRegionalCenterSection = async (id: number) => {
  const center = await prisma.section.findFirst({
    where: { id: id },
    select: { classroom: { select: { building: { select: { regionalCenterId: true } } } } }
  });
  const regionalCenterId = center.classroom.building.regionalCenterId;
  return regionalCenterId;
};

export const getMatriculados = async (sectionId: number) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { sectionId: sectionId, waitingListId: null },
    select: {
      student: {
        select: {
          user: {
            select: {
              id: true,
              identificationCode: true,
              institutionalEmail: true,
              images: {
                where: { avatar: true }, // Filtra las imágenes donde avatar es true
                select: { url: true } // Selecciona el campo que necesitas, ajusta según el nombre del campo
              },
              person: {
                select: {
                  dni: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                }
              }
            }
          }
        }
      }
    }
  });

  // Mapea el resultado para obtener solo los campos necesarios
  const matriculados = enrollments.map(enrollment => {
    // Extrae la imagen con avatar: true, si existe
    const avatarImage = enrollment.student.user.images.length > 0 ? enrollment.student.user.images[0].url : null;

    return {
      id: enrollment.student.user.id,
      identificationCode: enrollment.student.user.identificationCode,
      institutionalEmail: enrollment.student.user.institutionalEmail,
      avatar: avatarImage, // Incluye el campo avatar
      person: {
        dni: enrollment.student.user.person.dni,
        firstName: enrollment.student.user.person.firstName,
        middleName: enrollment.student.user.person.middleName,
        lastName: enrollment.student.user.person.lastName,
        secondLastName: enrollment.student.user.person.secondLastName
      }
    };
  });

  return matriculados;
};

export const getEnListadeEspera = async (sectionId: number) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { sectionId: sectionId, waitingListId: { not: null } },
    select: {
      student: {
        select: {
          user: {
            select: {
              id: true,
              identificationCode: true,
              institutionalEmail: true,
              images: {
                where: { avatar: true }, // Filtra las imágenes donde avatar es true
                select: { url: true } // Selecciona el campo que necesitas, ajusta según el nombre del campo
              },
              person: {
                select: {
                  dni: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Mapea el resultado para obtener solo los campos necesarios
  const matriculados = enrollments.map(enrollment => {
    // Extrae la imagen con avatar: true, si existe
    const avatarImage = enrollment.student.user.images.length > 0 ? enrollment.student.user.images[0].url : null;

    return {
      id: enrollment.student.user.id,
      identificationCode: enrollment.student.user.identificationCode,
      institutionalEmail: enrollment.student.user.institutionalEmail,
      avatar: avatarImage, // Incluye el campo avatar
      person: {
        dni: enrollment.student.user.person.dni,
        firstName: enrollment.student.user.person.firstName,
        middleName: enrollment.student.user.person.middleName,
        lastName: enrollment.student.user.person.lastName,
        secondLastName: enrollment.student.user.person.secondLastName
      }
    };
  });

  return matriculados;
};

export const getSiguientePeriodo = async () => {
  const now = new Date();
  const nextAcademicPeriod = await prisma.process.findFirst({
    where: {
      processTypeId: 5,
      startDate: { gte: now },
      finalDate: { gte: now },
    },
    orderBy: {
      startDate: 'asc'
    },
    select: {
      id: true,
      academicPeriod: {
        select: {
          id: true
        }
      }
    }
  });

  if (!nextAcademicPeriod) {
    throw new Error('No se encontró ningún siguiente período académico planificado.');
  }

  const idPeriodo = nextAcademicPeriod.academicPeriod.id;
  return idPeriodo;
}

export const getPeriodoActual = async () => {
  const academicPeriod = await prisma.process.findFirst({
    where: { processTypeId: 5, active: true, finalDate: { gte: new Date() }, startDate: { lte: new Date() } },
    select: { academicPeriod: { select: { id: true } } },
  });

  if (!academicPeriod) {
    throw new Error('No se encontró ningún periodo académico planificado.');
  }

  const idPeriodo = academicPeriod.academicPeriod.id;
  return idPeriodo;
}