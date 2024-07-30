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
    res.status(500).json({ message: 'Error al verificar la sección', error });
  }
};

// Verifica si el estudiante existe
export const existStudent = async (req: Request, res: Response, next: NextFunction) => {
  const  {id: userId} = req.user;  
  let { sectionId } = req.body;
  

  if (sectionId === undefined) {
      sectionId = parseInt(req.params.sectionId);
  }
  
    try {
      const user = await prisma.user.findUnique({
        where:{
          id: userId
        }
      })
      let studentId = user.id ;
      
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
      res.status(500).json({ message: 'Error al verificar el estudiante', error });
    }
  };


// Verifica si el estudiante ya está matriculado en la sección
export const notAlreadyEnrolled = async (req: Request, res: Response, next: NextFunction) => {
  const  {id: userId} = req.user;  
  const {sectionId } = req.body;

  
  
    try {

      const user = await prisma.user.findUnique({
        where:{
          id: userId
        }
      })

      let studentId = user.id

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          sectionId_studentId: {
            studentId,
            sectionId
          }
        }
      });
  
      if (enrollment) {
        return res.status(400).json({ message: 'El estudiante ya está matriculado en esta sección' });
      }
  
      // Si no está matriculado, pasar al siguiente middleware o controlador
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error al verificar la matrícula', error });
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
            where:{
                id: sectionId,
            },
            include: {academicPeriod:true}
        })

      const process = await prisma.process.findFirst({
        where: {
          academicPeriod: section.academicPeriod,
          processType: {
            id: 3,
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
    const  {id: userId} = req.user;

    let { sectionId } = req.body;
    

    if (sectionId === undefined) {
        sectionId = parseInt(req.params.sectionId);
    }
    //const { process } = req.body;
  
    try {

      const student_user = await prisma.user.findUnique({
        where: {
            id: userId,        
        },include:{
          role: true
        }
        
       });

        if(!(student_user.role.name == "STUDENT")){
          return res.status(400).json({ message: 'El rol del usuario no es de estudinate' });
        }
        //return false

        const student = await prisma.student.findUnique({
            where:{
                userId: student_user.id,
            }
        })

        const section = await prisma.section.findUnique({
            where:{
                id: sectionId
            },
            include:{
                academicPeriod:{
                    include:{
                        process:true
                    }
                }
            }
        })

        const process = await prisma.process.findUnique({
            where:{
                id: section.academicPeriod.process.id,
                active: true
            }
        })

      if (student.globalAverage === null || student.globalAverage === 0) {
        // Si el estudiante no tiene promedio global, se asume que es la primera vez que se matricula
        next();
      } else {
        

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
  
        const dayEnrolls = await prisma.dayEnroll.findMany({
          where: {
            processId: process.id,
            startDate: { lte: currentUtcDate },
            finalDate: { gte: currentUtcDate },
          },
          orderBy: {
            globalAvarage: 'asc',
          },
        });
  
        if (dayEnrolls.length === 0) {
          return res.status(400).json({ message: 'No hay fechas de matrícula disponibles para este estudiante en este momento.' });
        }
  
        const validEnroll = dayEnrolls.find((dayEnroll, index) => {
          const nextDayEnroll = dayEnrolls[index + 1];
          return student.globalAverage >= dayEnroll.globalAvarage && (!nextDayEnroll || student.globalAverage < nextDayEnroll.globalAvarage);
        });
  
        if (!validEnroll) {
          return res.status(400).json({ message: 'El estudiante no cumple con los requisitos de promedio global para matricularse en este momento.' });
        }
  
        next();
      }
    } catch (error) {
      console.error('Error al validar el período de matrícula del estudiante:', error);
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }
  };