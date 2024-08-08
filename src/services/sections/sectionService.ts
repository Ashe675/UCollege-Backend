// src/services/sectionService.ts
import { prisma } from '../../config/db';
import { Request, Response, NextFunction } from 'express';
import { checkActiveProcessByTypeId } from '../../middleware/checkActiveProcessGeneric';
import { getEnListadeEspera, getMatriculados,getPeriodoActual,getSiguientePeriodo, validateUserAndSection } from "../../utils/section/sectionUtils";

interface CreateSectionInput {
  IH: number;
  FH: number;
  classId: number;
  teacherId: number;
  classroomId: number;
  quota: number;
  days: number[]; // Array de IDs de días
}

export const createSectionNext = async (data: CreateSectionInput, req: Request) => {
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
    
        const now = new Date();
        const nextAcademicPeriod = await prisma.process.findFirst({
          where: {
            processTypeId: 5,
            startDate: { gte: now },
            finalDate: { gte: now},
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
          throw new Error('No se encontró ningún siguiente período académico.');
        }

        const idPeriodo = nextAcademicPeriod.academicPeriod.id;
    
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
        
        return {
          message: 'Sección creada correctamente',
          section: newSection
        };
      } catch (error) {
        console.error('Error creating section:', error);
        throw new Error(error.message);
      }
};

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
    where: { id: id },
    include: {
      section_Day: { select: { day: { select: { name: true, id: true } } } },
      teacher: { select: { person: true, identificationCode: true, institutionalEmail: true, id: true } },
      classroom: {
        select: {
          capacity: true,
          code: true,
          building: {
            select: { code: true, id: true }
          }
        }
      },
      class: true
    }
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
    matriculados: matriculados,
    quotasAvailability: section.capacity - matriculados.length,
    waitingList: waitingListStudents,
    waitingListCount: waitingListStudents.length
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
        quotasAvailability: section.capacity - matriculados.length,
        waitingList: waitingListStudents,
        waitingListCount: waitingListStudents.length

      };
    })
  );

  return { departmentname, sectionsWithDetails };
};

export const getSectionByDepartmentActualNext = async (req: Request) => {
  const userid = req.user?.id;
  const user = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
    where: { teacherId: userid },
    select: {
      regionalCenterFacultyCareerDepartment: { select: { departmentId: true, Departament: { select: { name: true } } } },
      regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: true
    }
  });

  const idPeriodo = await getSiguientePeriodo();

  const processCreateSection = await checkActiveProcessByTypeId(6)
  
  if(!processCreateSection) {
    throw new Error('Aún no se pueden planificar las clases del próximo periodo.')
  }

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
  const now = new Date();
  const currentAcademicPeriod = await prisma.process.findFirst({
    where: {
      processTypeId: 5,
      active: true,
      startDate: { lte: now },
      finalDate: { gte: now },
    },
    select:{academicPeriod:{select:{id:true}}}
  });

  const nextAcademicPeriod = await prisma.process.findFirst({
    where: {
      processTypeId: 5,
      startDate: { gte: now },
      finalDate: {gte:now}
    },
    select:{academicPeriod:{select:{id:true}}},
    orderBy: {
      startDate: 'asc',
    },
  });


  const academicPeriodSection = await prisma.section.findFirst({
    where:{id:id, OR: [{academicPeriodId: currentAcademicPeriod.academicPeriod.id},{academicPeriodId: nextAcademicPeriod ?  nextAcademicPeriod.academicPeriod.id : -1 }]},
  })

  if (!academicPeriodSection) {
    throw new Error('No se puede eliminar esta seccion porque pertenece a un periodo academico anterior');
  };
  await prisma.enrollment.deleteMany({
    where:{sectionId:id}
  })
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
        quotasAvailability: section.capacity - matriculados.length,
        waitingList: waitingListStudents,
        waitingListCount: waitingListStudents.length
      };
    })
  );

  return sectionsWithDetails;
};
export const getSectionsByTeacherIdNext = async (req: Request) => {
  const userid = req.user?.id;
  const idPeriodo = await getSiguientePeriodo();

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
export const getGradesBySectionId = async (sectionId: number, req: Request) => {
  const userId = req.user.id;
  const academicPeriodId = await getPeriodoActual();

  // Validar que el usuario tenga acceso a la sección
  await validateUserAndSection(userId, sectionId);

  // Obtener las notas junto con la información de la sección, el maestro y la clase
  const notas = await prisma.enrollment.findMany({
    where: {
      sectionId: sectionId,
      section: { academicPeriodId: academicPeriodId }
    },
    select: {
      studentId: true,
      grade: true,
      section: {
        select: {
          teacher: {
            select: {
              person: {
                select: {
                  dni: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                }
              },
              identificationCode: true,
              institutionalEmail: true,
              id:true,
              images: {
                select: {
                  url: true,
                  avatar: true,
                }
              }
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      },
      student: {
        select: {
          user: {
            select: {
              person: {
                select: {
                  dni: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true,
                }
              },
              institutionalEmail: true,
              identificationCode: true,
              id:true,
              images: {
                select: {
                  url: true,
                  avatar: true,
                }
              }
            }
          }
        }
      }
    }
  });

  // Si no se encuentran notas, se retorna un error
  if (notas.length === 0) {
    throw new Error('No se encontraron notas para esta sección.');
  }

  // Obtener la información de la sección, el maestro y la clase
  const { section } = notas[0];
  const className = section.class.name;
  const teacher = section.teacher;
  
  // Filtrar imágenes para obtener solo el avatar activo
  const getAvatar = (images: { url: string; avatar: boolean }[]) =>
    images.find(image => image.avatar)?.url || null;

  // Información del maestro
  const teacherInfo = {
    teacherId: teacher.id,
    dni: teacher.person.dni,
    firstName: teacher.person.firstName,
    middleName: teacher.person.middleName,
    lastName: teacher.person.lastName,
    secondLastName: teacher.person.secondLastName,
    institutionalEmail: teacher.institutionalEmail,
    identificationCode: teacher.identificationCode,
    avatar: getAvatar(teacher.images),
  };

  // Mapear las notas con la información de los estudiantes y sus avatares
  const grades = notas.map(nota => ({
    studentId: nota.studentId,
    userId: nota.student.user.id,
    dni: nota.student.user.person.dni,
    firstName: nota.student.user.person.firstName,
    middleName: nota.student.user.person.middleName,
    lastName: nota.student.user.person.lastName,
    secondLastName: nota.student.user.person.secondLastName,
    institutionalEmail: nota.student.user.institutionalEmail,
    identificationCode: nota.student.user.identificationCode,
    avatar: getAvatar(nota.student.user.images),
    grade: nota.grade
  }));

  // Retornar la información solicitada
  return {
    sectionId,
    className,
    teacher: teacherInfo,
    grades
  };
};
export const getEnrollmentsActual = async (req: Request) => {
  const userId = req.user.id;
  
  // Obtener el ID del centro regional y facultad del usuario
  const regionalCenter_Faculty = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
    where: { teacherId: userId },
    select: { regionalCenterFacultyCareerDepartment: { select: { regionalCenter_Faculty_CareerId: true } } }
  });

  const regionalCenter_FacultyCareerId = regionalCenter_Faculty?.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

  if (!regionalCenter_FacultyCareerId) {
    throw new Error('No se encontró el centro regional y facultad del usuario.');
  }

  // Obtener el período académico actual
  const academicPeriodId = await getPeriodoActual();
  const getAvatar = (images: { url: string; avatar: boolean }[]) =>
    images.find(image => image.avatar)?.url || null;
  // Obtener todas las inscripciones en el período actual
  const enrollments = await prisma.enrollment.findMany({
    where: {
      section: {
        academicPeriodId: academicPeriodId,
        regionalCenter_Faculty_CareerId: regionalCenter_FacultyCareerId
      }
    },
    select: {
      studentId: true,
      student: {
        select: {
          id: true,
          user: {
            select: {
              person: {
                select: {
                  dni: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  secondLastName: true
                }
              },
              institutionalEmail: true,
              identificationCode: true,
              images: {
                select: {
                  idImage: true,
                  url: true,
                  avatar: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Mapear la información de los estudiantes
  const result = enrollments.map(enrollment => ({
    studentId: enrollment.studentId,
    userId: enrollment.student.id,
    dni: enrollment.student.user.person.dni,
    firstName: enrollment.student.user.person.firstName,
    middleName: enrollment.student.user.person.middleName,
    lastName: enrollment.student.user.person.lastName,
    secondLastName: enrollment.student.user.person.secondLastName,
    institutionalEmail: enrollment.student.user.institutionalEmail,
    identificationCode: enrollment.student.user.identificationCode,
    avatar: getAvatar(enrollment.student.user.images) // Obtén el avatar usando la función getAvatar
  }));

  return result;
};






