// src/services/sectionService.ts
import { prisma } from '../../config/db';
import { Request, Response, NextFunction } from 'express';
import { getEnListadeEspera, getMatriculados } from "../../utils/section/sectionUtils";

interface CreateSectionInput {
  IH: number;
  FH: number;
  classId: number;
  teacherId: number;
  classroomId: number;
  quota: number;
  days: number[]; // Array de IDs de días
}
export const createSection = async (data: CreateSectionInput, req: Request) => {
  const userlogged = req.user?.id;
  const { IH, FH, classId, teacherId, classroomId, days, quota } = data;

  try {
    // Obtener el código de la clase
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { code: true },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    const classCode = classData.code;

    // Obtener la capacidad del aula
    const classroomData = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { capacity: true },
    });

    if (!classroomData) {
      throw new Error('Classroom not found');
    }

    if (quota <= 0) {
      throw new Error(`Cupos deben ser mayores a cero`);
    }


    const capacity = classroomData.capacity;

    if (quota > capacity) {
      throw new Error(`Cupos exceden la capacidad del aula ${capacity}`);
    }

    // Formatear la hora de inicio para el código de la sección
    const formattedIH = IH < 10 ? `0${IH}` : `${IH}`;

    const Department_Head = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: userlogged },
      select: { regionalCenterFacultyCareerDepartment: { select: { regionalCenter_Faculty_CareerId: true } } }
    });

    if (!Department_Head) {
      throw new Error('Department head not found');
    }

    const rcfcID = Department_Head.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

    const academicPeriod = await prisma.process.findFirst({
      where: { processTypeId: 5, active: true, finalDate: { gte: new Date() }, startDate: { lte: new Date() } },
      select: { academicPeriod: { select: { id: true } } },
    });

    if (!academicPeriod) {
      throw new Error('Academic period not found');
    }

    const idPeriodo = academicPeriod.academicPeriod.id;

    // Contar secciones existentes con el mismo código de clase, hora de inicio y academicPeriodId
    const existingSectionsCount = await prisma.section.count({
      where: {
        academicPeriodId: idPeriodo,
        IH,
        classId,
      },
    });

    // Generar el código de la sección
    const sectionCode = `${classCode}-${formattedIH}${existingSectionsCount.toString().padStart(2, '0')}`;

    // Crear la sección con el código generado y la capacidad obtenida
    const newSection = await prisma.section.create({
      data: {
        code: sectionCode,
        capacity: Number(quota),
        IH,
        FH,
        classId,
        regionalCenter_Faculty_CareerId: rcfcID,
        teacherId,
        classroomId,
        academicPeriodId: idPeriodo,
        section_Day: {
          create: days.map(dayId => ({
            dayId
          }))
        }
      },
      include: {
        section_Day: { select: { day: { select: { name: true } } } }
      }
    });

    await prisma.waitingList.create({
      data: {
        sectionId: newSection.id,
        top: 0,
      }
    });
    console.log("Hola");
    return {
      message: 'Sección creada correctamente',
      section: newSection
    };
  } catch (error) {
    console.error('Error creating section:', error);
    throw new Error(error.message);
  }
};
interface UpdateSectionInput {
  IH: number;
  FH: number;
  classId: number;
  teacherId: number;
  classroomId: number;
  active: boolean;
  days: number[]; // Array de días a actualizar
}
export const updateSection = async (id: number, data: UpdateSectionInput, req: Request) => {
  const { IH, FH, classId, teacherId, classroomId, active, days } = data;

  try {
    // Verificar si la sección existe
    const section = await prisma.section.findUnique({
      where: { id },
      include: { section_Day: true },
    });

    if (!section) {
      throw new Error('Section not found');
    }

    // Actualizar la sección con los nuevos datos proporcionados
    const updatedSection = await prisma.section.update({
      where: { id },
      data: {
        IH,
        FH,
        classId,
        teacherId,
        classroomId,
        active,
        section_Day: {
          deleteMany: {}, // Eliminar los días actuales
          create: days.map(dayId => ({ dayId })), // Crear los nuevos días
        },
      },
      include: { section_Day: { select: { day: { select: { name: true } } } } },
    });

    return updatedSection;
  } catch (error) {
    console.error('Error updating section:', error);
    throw new Error('Internal Server Error');
  }
};
export const updateSectionCapacity = async (id: number, increment: number) => {
  try {
    // Verificar si la sección existe
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        waitingList: {
          include: {
            enrollments: true
          }
        },
        classroom: true
      }
    });

    if (!section) {
      throw new Error('Section not found');
    }

    if (increment <= 0) {
      throw new Error('El incremento debe ser mayor a cero.');
    }


    if ((increment + section.capacity) > section.classroom.capacity) {
      throw new Error(`No se pueden aumentar ${increment} cupos ya que el aula no tiene la capacidad (${section.classroom.capacity}).`);
    }

    // Obtener el número de matriculados actuales (sin waitingListId)
    const matriculados = await prisma.enrollment.count({
      where: {
        sectionId: section.id,
        waitingListId: null
      }
    });

    // Calcular la nueva capacidad
    const newCapacity = section.capacity + increment;

    // Actualizar la capacidad de la sección
    const updatedSection = await prisma.section.update({
      where: { id },
      data: {
        capacity: newCapacity,
      },
    });

    // Obtener el número de cupos disponibles
    const availableSlots = newCapacity - matriculados;

    if (availableSlots > 0 && section.waitingList) {
      // Obtener los estudiantes en la lista de espera, ordenados por 'top' para inscribir a los primeros en la lista
      const waitingListEntries = await prisma.waitingList.findUnique({
        where: { id: section.waitingList.id },
        include: {
          enrollments: true
        }
      });

      // Seleccionar los primeros en la lista de espera según el número de cupos disponibles
      const waitingListEnrollments = waitingListEntries.enrollments
        .filter(enrollment => enrollment.waitingListId !== null) // Filtrar solo los que están en lista de espera
        .slice(0, availableSlots);

      for (const enrollment of waitingListEnrollments) {
        // Actualizar la inscripción para quitar el waitingListId
        await prisma.enrollment.update({
          where: {
            sectionId_studentId: {
              sectionId: enrollment.sectionId,
              studentId: enrollment.studentId
            }
          },
          data: {
            waitingListId: null
          }
        });
      }
    }

    return updatedSection;
  } catch (error) {
    console.error('Error updating section capacity:', error);
    throw new Error(error.message);
  }
};


const getCareerIdByDepartmentId = async (departmentId: number) => {
  const departmentData = await prisma.departament.findUnique({
    where: { id: departmentId },
    select: { careerId: true },
  });

  if (!departmentData) {
    throw new Error('Department not found');
  }

  return departmentData.careerId;
};
const getDepartmentIdByClassId = async (classId: number) => {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: { departamentId: true },
  });

  if (!classData) {
    throw new Error('Class not found');
  }

  return classData.departamentId;
};
export const getAllSections = async () => {
  const sections = await prisma.section.findMany({
    include: { section_Day: { select: { day: { select: { name: true } } } }, waitingList: true },
  }
  );
  const sectionsWithDetails = await Promise.all(
    sections.map(async (section) => {
      const [waitingListStudents, matriculados] = await Promise.all([
        getEnListadeEspera(section.id),
        getMatriculados(section.id)
      ]);

      return {
        ...section,
        matriculados: matriculados,
        waitingList: waitingListStudents,

      };
    })
  );

  return sectionsWithDetails;
};
export const getSectionById = async (id: number) => {
  // Obtén la sección por ID
  const section = await prisma.section.findUnique({
    where: { id },
    include: { section_Day: { select: { day: { select: { name: true } } } } }
  });

  if (!section) {
    throw new Error('Section not found');
  }

  // Obtén la lista de espera y los matriculados de manera concurrente
  const [waitingListStudents, matriculados] = await Promise.all([
    getEnListadeEspera(section.id),
    getMatriculados(section.id)
  ]);

  return {
    ...section,
    matriculados,
    waitingList: waitingListStudents
  };
};
export const getSectionByDepartment = async (req: Request) => {
  const userid = req.user?.id;
  const user = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
    where: { teacherId: userid },
    select: {
      regionalCenterFacultyCareerDepartment: { select: { departmentId: true, Departament: { select: { name: true } } } },
      regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: true
    }
  });

  const departmentname = user.regionalCenterFacultyCareerDepartment.Departament.name;
  const userdepartmentid = user.regionalCenterFacultyCareerDepartment.departmentId;
  const regionalCenterFacultyUser = user.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id

  const sections = await prisma.section.findMany({
    where: { class: { departamentId: userdepartmentid }, regionalCenter_Faculty_CareerId: regionalCenterFacultyUser },
    include: { section_Day: { select: { day: { select: { name: true } } } }, waitingList: true }
  });

  const sectionsWithDetails = await Promise.all(
    sections.map(async (section) => {
      const [waitingListStudents, matriculados] = await Promise.all([
        getEnListadeEspera(section.id),
        getMatriculados(section.id)
      ]);

      return {
        ...section,
        matriculados: matriculados,
        waitingList: waitingListStudents,

      };
    })
  );


  return { departmentname, sectionsWithDetails };
};

export const getSectionByDepartmentActual = async (req: Request) => {
  const userid = req.user?.id;
  const user = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
    where: { teacherId: userid },
    select: {
      regionalCenterFacultyCareerDepartment: { select: { departmentId: true, Departament: { select: { name: true } } } },
      regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: true
    }
  });

  const periodoActual = await prisma.academicPeriod.findFirst({
    where: {
      process: {
        active: true,
        startDate: { lte: new Date() },
        finalDate: { gte: new Date() }
      }
    }
  });

  if (!periodoActual) {
    throw new Error('No hay un periodo acadmico activo todavia');
  }

  const idPeriodo = periodoActual.id;
  const departmentname = user.regionalCenterFacultyCareerDepartment.Departament.name;
  const userdepartmentid = user.regionalCenterFacultyCareerDepartment.departmentId;
  const regionalCenterFacultyUser = user.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id

  const sections = await prisma.section.findMany({
    where: { class: { departamentId: userdepartmentid }, academicPeriodId: idPeriodo, active: true, regionalCenter_Faculty_CareerId: regionalCenterFacultyUser },
    include: {
      section_Day: { select: { day: { select: { name: true } } } },
      classroom: {
        select: {
          code: true,
          building: {
            select: { code: true }
          }
        }
      },
      teacher: {
        select: {
          institutionalEmail: true,
          person: true,
          id: true,
          identificationCode: true
        }
      }
    }
  });

  const sectionsWithDetails = await Promise.all(
    sections.map(async (section) => {
      const [waitingListStudents, matriculados] = await Promise.all([
        getEnListadeEspera(section.id),
        getMatriculados(section.id)
      ]);

      return {
        ...section,
        matriculados: matriculados,
        quotasAvailability : section.capacity - matriculados.length,
        waitingList: waitingListStudents,
        waitingListCount : waitingListStudents.length

      };
    })
  );

  return { departmentname, sectionsWithDetails };
};

export const deleteSection = async (id: number, justification: string) => {
  return await prisma.section.update({
    where: { id },
    data: {
      active: false,
      justification: justification,
    },
  });
};
export const sectionExists = async (id: number) => {
  const section = await prisma.section.findUnique({
    where: { id },
  });
  return !!section;
};
export const getSectionsByTeacherId = async (req: Request) => {
  const userid = req.user?.id;
  const periodoActual = await prisma.academicPeriod.findFirst({
    where: {
      process: {
        active: true,
        startDate: { lte: new Date() },
        finalDate: { gte: new Date() }
      }
    }
  });
  const idPeriodo = periodoActual.id;

  const sections = await prisma.section.findMany({
    where: { teacherId: userid, academicPeriodId: idPeriodo, active: true },
    include: { section_Day: { select: { day: { select: { name: true } } } } }
  });

  // Itera sobre cada sección y obtiene la lista de espera y los matriculados
  const sectionsWithDetails = await Promise.all(
    sections.map(async (section) => {
      const [waitingListStudents, matriculados] = await Promise.all([
        getEnListadeEspera(section.id),
        getMatriculados(section.id)
      ]);

      return {
        ...section,
        matriculados: matriculados,
        quotasAvailability : section.capacity - matriculados.length,
        waitingList: waitingListStudents,
        waitingListCount : waitingListStudents.length
      };
    })
  );

  return sectionsWithDetails;
};
export const getTeachersByDepartment = async (req: Request) => {
  const userid = req.user?.id;
  const user = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
    where: { teacherId: userid },
    select: { regionalCenterFacultyCareerDepartment: { select: { departmentId: true, Departament: { select: { name: true } }, RegionalCenterFacultyCareer: { select: { regionalCenter_Faculty: { select: { regionalCenterId: true } } } } } } }
  });

  const departmentname = user.regionalCenterFacultyCareerDepartment.Departament.name;
  const userDepartmentId = user.regionalCenterFacultyCareerDepartment.departmentId;
  const userRegionalCenterId = user.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenterId;

  const teachers = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findMany({
    where: {
      regionalCenterFacultyCareerDepartment: {
        departmentId: userDepartmentId,
        RegionalCenterFacultyCareer: {
          regionalCenter_Faculty: { regionalCenterId: userRegionalCenterId }
        }
      }
    },
    select: {
      teacher: {
        select: {
          id: true,
          identificationCode: true,
          personId: true,
          active: true,
          institutionalEmail: true,
          verified: true,
          description: true,
          roleId: true,
          images: { where: { avatar: true }, select: { url: true } },
          person: {
            select: {
              firstName: true,
              lastName: true,
              dni: true
            }
          }
        }
      }
    }
  });

  return { departmentname, teachers };
};
export const getWaitingListById = async (sectionId: number) => {
  // Primero, obtenemos la sección para conseguir la lista de espera
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { waitingList: { select: { id: true } } }
  });

  if (!section || !section.waitingList) {
    throw new Error('Sección no encontrada o no tiene lista de espera');
  }

  const waitingListStudents = getEnListadeEspera(sectionId);

  // Luego, obtenemos los estudiantes en espera basándonos en el waitingListId

  return waitingListStudents;
};






