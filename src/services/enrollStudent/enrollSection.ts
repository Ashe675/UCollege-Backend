import { prisma } from "../../config/db";
import { checkActiveProcessByTypeId } from "../../middleware/checkActiveProcessGeneric";

export const enrollInSection = async (studentId: number, sectionId: number) => {
  // Verificar si el estudiante ya está matriculado en la sección
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { sectionId_studentId: { studentId, sectionId } },
  });

  if (existingEnrollment) {
    return 'already enrolled';
  }

  // Obtener los detalles de la sección
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      enrollments: true,
      class: true
    },
  });




  if (!section) {
    throw new Error('Section not found');
  }

  // Verificar si el estudiante ha aprobado los requisitos de la clase
  const prerequisites = await prisma.studyPlan_Class.findMany({
    where: { classId: section.class.id }
  });

  if (prerequisites.length > 0) {


    const prerequisiteClassIds = prerequisites
      .map(req => req.prerequisiteClassId)
      .filter(id => id !== null && id !== undefined); // Filtrar valores nulos o indefinidos


    if (prerequisiteClassIds.length > 0) {
      // Verificar las clases completadas por el estudiante
      const completedClasses = await prisma.enrollment.findMany({
        where: {
          studentId: studentId,
          sectionId: { in: prerequisiteClassIds },
          grade: { gte: 65 }
        },
      });




      if (completedClasses.length < prerequisiteClassIds.length) {
        return 'prerequisites not met';
      }
    }
  }



  // Verificar si hay cupos disponibles
  if (section.enrollments.length >= section.capacity) {
    // Verificar conflictos de horarios con otras secciones
    const conflicts = await checkScheduleConflicts(studentId, section.IH, section.FH);


    if (conflicts.length > 0) {
      return 'time conflict';
    }


    let waitingList = await prisma.waitingList.findFirst({
      where: {
        sectionId: sectionId
      }
    })

    let waitingListId = waitingList.id

    await prisma.enrollment.create({
      data: {
        studentId,
        sectionId,
        waitingListId
      },
    });

    return 'added to waiting list';
  }



  // Matricular al estudiante en la sección
  await prisma.enrollment.create({
    data: {
      studentId,
      sectionId,
    },
  });




  return 'success';
};

const checkScheduleConflicts = async (studentId: number, IH: number, FH: number) => {

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { section: true },
  });

  return enrollments.filter(enrollment => {
    const { IH: existingIH, FH: existingFH } = enrollment.section;

    return !(FH <= existingIH || IH >= existingFH);
  });
};

export const getAvailableSectionsForStudent = async (studentId: number) => {
  // Obtener la información del estudiante
  const estu = await prisma.student.findFirst({
    where: { id: studentId },
    select: { userId: true, globalAverage: true }
  });

  const process = await checkActiveProcessByTypeId(3);

  const currentDate = new Date();

  // Convertir currentDate a UTC
  const currentUtcDate = new Date(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(),
    currentDate.getUTCHours(),
    currentDate.getUTCMinutes(),
    currentDate.getUTCSeconds()
  );


  if (estu.globalAverage === null || estu.globalAverage === 0) {
    const dayEnrolls = await prisma.dayEnroll.findMany({
      where: {
        processId: process.id
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    if (dayEnrolls.length === 0) {
      throw new Error('No hay fechas de matrícula disponibles para este estudiante en este momento.');
    }

    // Verifica si la fecha actual coincide con el primer día de matrícula
    const firstDayEnroll = dayEnrolls[0];
    if (currentDate < firstDayEnroll.startDate || currentDate > firstDayEnroll.finalDate) {
      throw new Error('Tu día de matrícula terminó o aún no ha empezado.');
    }

  } else {
    const dayEnrolls = await prisma.dayEnroll.findMany({
      where: {
        processId: process.id,
        startDate: {
          lte: currentDate,
        },
        finalDate: {
          gte: currentDate
        }
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    if (dayEnrolls.length === 0) {
      throw new Error('No hay fechas de matrícula disponibles para este estudiante en este momento.');
    }

    const validEnroll = dayEnrolls.find((dayEnroll, index) => {
      const nextDayEnroll = dayEnrolls[index + 1];
      // Si no hay un día de matrícula siguiente, solo verifica el límite inferior
      if (!nextDayEnroll) {
        return estu.globalAverage >= dayEnroll.globalAvarage;
      }

      // Verificar si el promedio global está dentro del rango para el día de matrícula actual
      return estu.globalAverage >= dayEnroll.globalAvarage && estu.globalAverage < nextDayEnroll.globalAvarage;

    });

    if (!validEnroll) {
      throw new Error("No cumples con los requisitos de promedio global para matricularse en este momento");
    }



  }

  const idusuario = estu.userId;

  // Obtener la carrera y el centro regional del usuario
  const usuario = await prisma.regionalCenter_Faculty_Career_User.findFirst({
    where: { userId: idusuario },
    select: {
      regionalCenter_Faculty_Career: {
        select: {
          careerId: true,
          regionalCenter_Faculty: {
            select: { regionalCenterId: true }
          }
        }
      }
    }
  });

  const carreraEstudiante = usuario.regionalCenter_Faculty_Career.careerId;
  const centroEstudiante = usuario.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenterId;

  // Obtener todas las clases que el estudiante ha aprobado
  const approvedClasses = await prisma.enrollment.findMany({
    where: {
      studentId: studentId,
      grade: { gte: 65 }
    },
    select: {
      section: {
        select: {
          classId: true
        }
      }
    }
  });

  const approvedClassIds = approvedClasses.map(enrollment => enrollment.section.classId);

  // Obtener todas las secciones disponibles en ese centro y carrera
  const allSections = await prisma.section.findMany({
    where: {
      active : true,
      classroom: {
        building: {
          regionalCenterId: centroEstudiante
        }
      },
      class: {
        studyPlan: {
          some: {
            studyPlan: { careerId: carreraEstudiante }
          }
        },
        id: { notIn: approvedClassIds } // Excluir las clases ya aprobadas
      }
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          UV: true,
          code: true,
          studyPlan: {
            select: {
              prerequisiteClassId: true // Incluir los IDs de los requisitos previos
            }
          }
        }
      },
      section_Day: { select: { day: { select: { name: true } } } },
      teacher: { include: { person: { select: { firstName: true, middleName: true, lastName: true, secondLastName: true } } } },
      waitingList: { select: { id: true } },
    }
  });

  // Filtrar las clases basadas en los requisitos previos
  const availableClassesMap: { [key: number]: any } = {};

  for (const section of allSections) {
    const studyPlanClasses = section.class.studyPlan;
    const classId = section.class.id;

    let hasCompletedPrerequisites = true; // Asumimos que el estudiante cumple con los requisitos por defecto


    for (const planClass of studyPlanClasses) {
      if (planClass.prerequisiteClassId) {
        if (!approvedClassIds.includes(planClass.prerequisiteClassId)) {
          hasCompletedPrerequisites = false;
          break; // Salir del loop si no cumple con un requisito
        }
      }
    }

    if (hasCompletedPrerequisites) {

      let inEnroll = false;
      let inWaitingList = false;
      let allReadyClassEnroll = false;

      let enrollData = await prisma.enrollment.findFirst({
        where: {
          studentId: studentId,
          sectionId: section.id
        }, include: {
          section: true,
        }
      })

      if (enrollData && !enrollData.waitingListId && enrollData.active) {
        inEnroll = true;
      }

      if (enrollData && enrollData.waitingListId && enrollData.active) {
        inWaitingList = true;
      }

      if (enrollData && enrollData.section.classId == section.classId && enrollData.active) {
        allReadyClassEnroll = true
      }

      const matriculados = await prisma.enrollment.count({
        where: {
          sectionId: section.id,
          active : true,
          waitingListId: null
        }
      });

      const listadeespera = await prisma.enrollment.count({
        where: {
          sectionId: section.id,
          active : true,
          waitingListId: section.waitingList.id
        }
      });

      // Obtener el número de cupos disponibles
      const cupos = section.capacity - matriculados;
      if (!availableClassesMap[classId]) {
        availableClassesMap[classId] = {
          id: classId,
          name: section.class.name,
          uv: section.class.UV,
          code: section.class.code,
          sections: [],
          allReadyClassEnroll: allReadyClassEnroll,
        };
      }
      availableClassesMap[classId].sections.push({
        id: section.id,
        code: section.code,
        IH: section.IH,
        FH: section.FH,
        quotes: cupos,
        waitingList: listadeespera,
        teacher: {
          firstName: section.teacher.person.firstName,
          middleName: section.teacher.person.middleName,
          lastName: section.teacher.person.lastName,
          secondLastName: section.teacher.person.secondLastName,
        },
        days: section.section_Day.map(days => days.day.name),
        inEnrollment: inEnroll,
        inWaitingList: inWaitingList,

      });
    }
  }

  // Convertir el mapa a una lista
  const availableClasses = Object.values(availableClassesMap);

  return availableClasses;
};

export const getEnrolledClassesForStudent = async (studentId: number) => {
  // Obtener la información del estudiante
  const estu = await prisma.student.findFirst({
    where: { id: studentId },
    select: { userId: true }
  });

  if (!estu) {
    throw new Error('Student not found');
  }

  const idusuario = estu.userId;

  // Obtener la carrera y el centro regional del usuario
  const usuario = await prisma.regionalCenter_Faculty_Career_User.findFirst({
    where: { userId: idusuario },
    select: {
      regionalCenter_Faculty_Career: {
        select: {
          careerId: true,
          regionalCenter_Faculty: {
            select: { regionalCenterId: true }
          }
        }
      }
    }
  });

  if (!usuario) {
    throw new Error('User not found in regional center and faculty career');
  }

  const carreraEstudiante = usuario.regionalCenter_Faculty_Career.careerId;
  const centroEstudiante = usuario.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenterId;

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

  // Obtener las clases matriculadas del estudiante
  const enrolledClasses = await prisma.enrollment.findMany({
    where: {
      studentId: studentId,
      section: {
        class: {
          studyPlan: {
            some: {
              studyPlan: { careerId: carreraEstudiante }
            }
          }
        }, academicPeriodId: idPeriodo,
        classroom: {
          building: {
            regionalCenterId: centroEstudiante
          }
        }
      }, 
      waitingListId: null,
      active : true,
    },
    include: {
      section: {
        include: {
          class: true,
          teacher: {
            include: {
              person: true
            }
          },
          section_Day: {
            include: {
              day: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Filtrar las clases y devolver solo las clases matriculadas
  const enrolledClassDetails = enrolledClasses.map(enrollment => ({
    classId: enrollment.section.class.id,
    className: enrollment.section.class.name,
    sectionCode: enrollment.section.code,
    HI: enrollment.section.IH,
    HF: enrollment.section.FH,
    teacher: {
      firstName: enrollment.section.teacher.person.firstName,
      middleName: enrollment.section.teacher.person.middleName,
      lastName: enrollment.section.teacher.person.lastName,
      secondLastName: enrollment.section.teacher.person.secondLastName,
    },
    days: enrollment.section.section_Day.map(days => days.day.name),
    sectionId: enrollment.section.id
  }));

  return enrolledClassDetails;
};

export const updateTeacherGrade = async (userId: number, sectionId: number, teacherGrade: number) => {
  // Validar que el valor sea de 0 a 100
  if (teacherGrade < 0 || teacherGrade > 100) {
    throw new Error('La evaluación del docente debe ser un número entre 0 y 100.');
  }
  const student = await prisma.student.findFirst({
    where: {userId: userId},
    select: {id:true}
  });
  const studentId = student.id;
  // Obtener la inscripción del estudiante en la sección especificada
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      sectionId_studentId: {
        sectionId,
        studentId: studentId,
      }
    }
  });

  if (!enrollment) {
    throw new Error('No esta matriculado en esta seccion.');
  }

  // Actualizar la evaluación del docente
  await prisma.enrollment.update({
    where: {
      sectionId_studentId: {
        sectionId,
        studentId: studentId
      }
    },
    data: {
      TeacherGrade: teacherGrade
    }
  });
};

