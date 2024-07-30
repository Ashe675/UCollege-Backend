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

    
    
    await prisma.waitingList.upsert({
      where: { sectionId },
      update: {
        enrollments: {
          create: {
            studentId,
            sectionId,
          },
        },
      },
      create: {
        sectionId,
        enrollments: {
          create: {
            studentId,
            sectionId,
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