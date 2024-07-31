import { prisma } from "../../config/db";

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
    where: {classId: section.class.id}
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

     // Contar el número de registros actuales en la lista de espera para la sección
    const count = await prisma.waitingList.count({
      where: {
        sectionId: sectionId,
      },
    });

    // Calcular el nuevo valor para el campo top
    const newTop = count + 1;
    
    // Insertar el nuevo registro en la lista de espera con el valor calculado para top
    await prisma.waitingList.create({
      data: {
        sectionId: sectionId,
        top: newTop,
        enrollments: {
          create: {
            studentId: studentId,
            sectionId: sectionId,
          },
        },
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
    select: { userId: true }
  });

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
        include: {
          studyPlan: {
            select: {
              prerequisiteClassId: true // Incluir los IDs de los requisitos previos
            }
          }
        }
      }
    }
  });

  // Filtrar las secciones basadas en los requisitos previos
  const availableSections: any[] = [];

  for (const section of allSections) {
    const studyPlanClasses = section.class.studyPlan;

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
      availableSections.push(section);
    }
  }
  
  return availableSections;
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

  const idPeriodo =  periodoActual.id;

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
        },academicPeriodId : idPeriodo,
        classroom: {
          building: {
            regionalCenterId: centroEstudiante
          }
        }
      }, waitingListId : null,
    },
    include: {
      section: {
        include: {
          class: true
        }
      }
    }
  });

  // Filtrar las clases y devolver solo las clases matriculadas
  const enrolledClassDetails = enrolledClasses.map(enrollment => ({
    classId: enrollment.section.class.id,
    className: enrollment.section.class.name,
    sectionCode: enrollment.section.code,
    Hora_Incio: enrollment.section.IH,
    Hora_Final: enrollment.section.FH
  }));

  return enrolledClassDetails;
};
