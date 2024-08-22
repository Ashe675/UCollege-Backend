import { stdin } from 'process';
import { prisma } from '../../config/db';
import { Request, Response, NextFunction } from 'express';

// Verifica si la sección existe
export const existSection = async (req: Request, res: Response, next: NextFunction) => {


  let { sectionId } = req.body;



  if (sectionId === undefined) {
    sectionId = parseInt(req.params.sectionId);
  }
  

  try {
    const section = await prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }

    // Si la sección existe, pasar al siguiente middleware o controlador
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error al verificar la sección', error });
  }
};

// Verifica si el estudiante existe
export const existStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user;
  let { sectionId } = req.body;


  if (sectionId === undefined) {
    sectionId = parseInt(req.params.sectionId);
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })
    let studentId = user.id;

    // Verificar si el estudiante existe

    const student = await prisma.student.findUnique({
      where: { userId: userId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    // Verificar si el estudiante ya está matriculado en la sección
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        sectionId_studentId: {
          sectionId,
          studentId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'El estudiante ya está matriculado en esta sección' });
    }

    // Verificar si el estudiante está en la lista de espera para la sección
    const waitingListEntry = await prisma.waitingList.findUnique({
      where: { sectionId }
    });

    if (waitingListEntry) {
      const waitingListEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          waitingListId: waitingListEntry.id
        }
      });

      if (waitingListEnrollment) {
        return res.status(400).json({ message: 'El estudiante ya está en la lista de espera para esta sección' });
      }
    }

    // Si el estudiante no está matriculado ni en lista de espera, pasar al siguiente middleware o controlador
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error al verificar el estudiante', error });
  }
};


// Verifica si el estudiante ya está matriculado en la sección
export const notAlreadyEnrolled = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user;
  const { sectionId } = req.body;



  try {

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    let studentId = (await prisma.student.findUnique({ where: { userId: user.id } })).id


    const enrollment = await prisma.enrollment.findUnique({
      where: {
        sectionId_studentId: {
          studentId,
          sectionId
        },
        active : true
      }
    });

    if (enrollment) {
      return res.status(400).json({ message: 'El estudiante ya está matriculado en esta sección' });
    }

    // Si no está matriculado, pasar al siguiente middleware o controlador
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error al verificar la matrícula', error });
  }
};

// Función para verificar si el proceso de matrícula está activo en el período académico
export const validEnrollmentProcess = async (req: Request, res: Response, next: NextFunction) => {
  let { sectionId } = req.body;

  if (sectionId === undefined) {
    sectionId = parseInt(req.params.sectionId);
  }

  try {
    const section = await prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: { academicPeriod: true }
    })

    const process = await prisma.process.findFirst({
      where: {
        processId: section.academicPeriod.processId,
        processType: {
          name: 'MATRÍCULA'
        },
        active: true,
      },
    });

    if (!process) {
      return res.status(400).json({ message: 'No hay un proceso de matrícula activo para este período académico.' });
    }

    next();
  } catch (error) {
    console.error('Error al verificar el proceso de matrícula:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función para validar el período de matrícula del estudiante por su calificacion
export const validateStudentEnrollmentPeriod = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user;

  let { sectionId } = req.body;


  if (sectionId === undefined) {
    sectionId = parseInt(req.params.sectionId);
  }
  //const { process } = req.body;

  try {

    const student_user = await prisma.user.findUnique({
      where: {
        id: userId,
      }, include: {
        role: true
      }

    });

    if (!(student_user.role.name == "STUDENT")) {
      return res.status(400).json({ message: 'El rol del usuario no es de estudinate' });
    }
    //return false

    if (req.originalUrl.includes('enroll-delete')) {
      return next()
    }


    const student = await prisma.student.findUnique({
      where: {
        userId: student_user.id,
      }
    })

    const section = await prisma.section.findUnique({
      where: {
        id: sectionId
      },
      include: {
        academicPeriod: {
          include: {
            process: true
          }
        }
      }
    })

    const process = await prisma.process.findFirst({
      where: {
        processId: section.academicPeriod.process.id,
        active: true,
        processTypeId: 3
      }
    })

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



    if (student.globalAverage === null || student.globalAverage === 0) {
      const dayEnrolls = await prisma.dayEnroll.findMany({
        where: {
          processId: process.id,
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      if (dayEnrolls.length === 0) {
        return res.status(400).json({ message: 'No hay fechas de matrícula disponibles para este estudiante en este momento.' });
      }


      // Verifica si la fecha actual coincide con el primer día de matrícula
      const firstDayEnroll = dayEnrolls[0];

      if (currentDate < firstDayEnroll.startDate || currentDate > firstDayEnroll.finalDate) {
        return res.status(400).json({ message: "No cumples con los requisitos de promedio global para matricularse en este momento" });
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
        return res.status(400).json({ message: 'No hay fechas de matrícula disponibles para este estudiante en este momento.' });
      }


      const validEnroll = dayEnrolls.find((dayEnroll, index) => {
        const nextDayEnroll = dayEnrolls[index + 1];
        // Si no hay un día de matrícula siguiente, solo verifica el límite inferior
        if (!nextDayEnroll) {
          return student.globalAverage >= dayEnroll.globalAvarage;
        }

        // Verificar si el promedio global está dentro del rango para el día de matrícula actual
        return student.globalAverage >= dayEnroll.globalAvarage && student.globalAverage < nextDayEnroll.globalAvarage;

      });

      if (!validEnroll) {
        return res.status(400).json({ message: 'No cumples con los requisitos de promedio global para matricularse en este momento.' });
      }
    }

    next();
  } catch (error) {
    console.error('Error al validar el período de matrícula del estudiante:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const isSameClass = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user;
  let { sectionId } = req.body;


  if (sectionId === undefined) {
    sectionId = parseInt(req.params.sectionId);

  }

  try {

    const studentId = (await prisma.student.findUnique({ where: { userId: userId } })).id

    const newSection = await prisma.section.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        class: true
      }
    });

    const enrollmentdSections = await prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        section: {
          class: {
            id: newSection.classId
          }
        }
      },
      include: {
        section: {
          include: {
            class: true
          }
        },
      }
    });

    if (enrollmentdSections) {
      return res.status(400).json({ message: 'Ya tienes la clase matriculada en otra seccion.' });
    }


    next();
  } catch (error) {
    console.error('Error al verificar que la clase ya esta matriculada en otra secion:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }


}

export const isStudentOfSectionRegion = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user;

  let { sectionId } = req.body;


  if (sectionId === undefined) {
    sectionId = parseInt(req.params.sectionId);
  }
  try {
    const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { 
      regionalCenter_Faculty_Career:{
        include: {
          regionalCenter_Faculty:{
            include:{
              regionalCenter:true
            }
          }
        }
      }

     } });
    const studnet = await prisma.user.findUnique({ where: { id: userId }, });

    const regionalCenter_Faculty_Career_user = await prisma.regionalCenter_Faculty_Career_User.findFirst({
      where: {
        userId: studnet.id,
        
      }, include:{
        regionalCenter_Faculty_Career:{
          include:{
            regionalCenter_Faculty:{
              include:{
                regionalCenter: true
              }
            }
          }
        }
      }
    });

    if(!regionalCenter_Faculty_Career_user){
      return res.status(400).json({ message: 'No hay una relacion entre usuario y su centro regional, facultad, carrera' });
    
    }

    console.log(section)
    console.log(studnet)

    if (
      !(regionalCenter_Faculty_Career_user.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenter.id ==
      section.regionalCenter_Faculty_Career.regionalCenter_Faculty.regionalCenterId)
    ) {
      return res.status(400).json({ message: 'El estudiente no es de este centro regional' });
    }
    next();

  } catch (error) {
    console.error('Error al verificar que el setudiante pertenece a este centro y facultad:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}