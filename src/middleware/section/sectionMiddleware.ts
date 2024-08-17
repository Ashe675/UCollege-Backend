import { Request, Response, NextFunction } from 'express';
import { prisma } from "../../config/db";
import { getSiguientePeriodo, getPeriodoActual } from "../../utils/section/sectionUtils";

export const checkClassExistsAndActive = async (req: Request, res: Response, next: NextFunction) => {

  const { classId } = req.body;
  try {
    const existingClass = await prisma.class.findUnique({
      where: { id: classId, active: true },
    });

    if (!existingClass) {
      return res.status(400).json({ error: 'La clase con este ID no existe o no está activa' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server erroree Jose' });
  }
};


export const checkIsAccessToSeccion = async (req: Request, res: Response, next: NextFunction) => {
  const { id: userId } = req.user;
  const sectionId = req.params.id;


  if (isNaN(+sectionId)) {
    return res.status(401).json({ error: 'Sección inválida' });
  }

  try {
    const section = await prisma.section.findUnique({
      where: {
        id: Number(sectionId), active: true,
        OR: [
          {
            enrollments: {
              some: {
                active : true,
                waitingListId : null,
                student: {
                  userId: userId
                }
              }
            }
          },
          {
            teacherId: userId
          }
        ]
      },
    });

    if (!section) {
      return res.status(400).json({ error: 'No tiene acceso a esta sección' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkCorrectHour = async (req: Request, res: Response, next: NextFunction) => {

};

export const checkClassCareerandCenterandTeacher = async (req: Request, res: Response, next: NextFunction) => {
  const userid = req.user?.id;
  const { classId, teacherId } = req.body;
  try {
    const carreraclase = await prisma.class.findUnique({
      where: { id: classId, active: true },
      select: { departament: { select: { career: { select: { id: true } } } } }
    });

    const carrerateacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: teacherId, active: true },
      select: { regionalCenterFacultyCareerDepartment: { select: { Departament: { select: { careerId: true } } } } }
    });

    const centrodeljefedep = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: userid, active: true },
      select: { regionalCenterFacultyCareerDepartment: { select: { RegionalCenterFacultyCareer: { select: { regionalCenter_Faculty: { select: { regionalCenterId: true } } } } } } }
    });

    const carreradeljefedep = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: userid, active: true },
      select: { regionalCenterFacultyCareerDepartment: { select: { RegionalCenterFacultyCareer: { select: { careerId: true } } } } }
    });

    const centrodeljefe = centrodeljefedep.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenterId;
    const carreradeljefe = carreradeljefedep.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.careerId;
    const idcarrerateacher = carrerateacher.regionalCenterFacultyCareerDepartment.Departament.careerId;
    const idcarreraclase = carreraclase.departament.career.id;

    const centrocarrera = await prisma.regionalCenter_Career.findFirst({
      where: { regionalCenterId: centrodeljefe, careerId: idcarreraclase }
    });

    if (!centrocarrera) {
      return res.status(400).json({ error: 'Esta clase no esta disponible en este centro' });
    }

    if (idcarrerateacher !== carreradeljefe) {
      return res.status(400).json({ error: 'El maestro no pertenece a su carrera' });
    }

    if (idcarrerateacher !== idcarreraclase) {
      return res.status(400).json({ error: 'Esta clase no esta incluida en la carrera del maestro' });
    }

    if (carreradeljefe !== idcarreraclase) {
      return res.status(400).json({ error: 'Esta clase no pertenece a su carrera' });
    }





    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const checkSectionandCenterDepartment = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const sectionId = req.params.id;

  if (!userId || !sectionId) {
    return res.status(400).json({ error: 'Falta el ID de usuario o ID de seccion' });
  }

  try {
    const sectionFaculty = await prisma.section.findFirst({
      where: { id: Number(sectionId) },
      select: { regionalCenter_Faculty_CareerId: true }
    });

    if (!sectionFaculty) {
      return res.status(404).json({ error: 'Seccion no encontrada' });
    }

    const teacherFaculty = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: userId },
      select: { regionalCenterFacultyCareerDepartment: { select: { regionalCenter_Faculty_CareerId: true } } }
    });

    if (!teacherFaculty) {
      return res.status(404).json({ error: 'Maestro no encontrado' });
    }

    const sectionRegionalCenter_Faculty_CareerId = sectionFaculty.regionalCenter_Faculty_CareerId;
    const teacherRegionalCenter_Faculty_CareerId = teacherFaculty.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

    if (sectionRegionalCenter_Faculty_CareerId !== teacherRegionalCenter_Faculty_CareerId) {
      return res.status(403).json({ error: 'Este usuario no tiene acceso a esta seccion' });
    }

    next();
  } catch (error) {
    console.error('Error checking regional center faculty:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const checkClassroomAvailability = async (req: Request, res: Response, next: NextFunction) => {
  const { IH, FH, classroomId, days } = req.body;
  const IdPeriodo = await getPeriodoActual();
  try {
    // Obtener las secciones conflictivas
    const conflictingSections = await prisma.section.findMany({
      where: {
        classroomId,
        academicPeriodId: IdPeriodo,
        section_Day: {
          some: {
            dayId: { in: days }
          }
        },
        OR: [
          {
            IH: { lte: IH },
            FH: { gt: IH },
          },
          {
            IH: { lt: FH },
            FH: { gte: FH },
          },
          {
            IH: { gte: IH },
            FH: { lte: FH },
          },
        ],
      },
      include: {
        section_Day: true,
      },
    });

    if (conflictingSections.length > 0) {
      return res.status(400).json({ error: 'El aula ya está ocupada dentro de esas horas y días.' });
    }

    next();
  } catch (error) {
    console.error('Error checking classroom availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkClassroomAvailabilityNext = async (req: Request, res: Response, next: NextFunction) => {
  const { IH, FH, classroomId, days } = req.body;
  const idPeriodo = await getSiguientePeriodo();
  try {
    // Obtener las secciones conflictivas
    const conflictingSections = await prisma.section.findMany({
      where: {
        classroomId,
        academicPeriodId: idPeriodo,
        section_Day: {
          some: {
            dayId: { in: days }
          }
        },
        OR: [
          {
            IH: { lte: IH },
            FH: { gt: IH },
          },
          {
            IH: { lt: FH },
            FH: { gte: FH },
          },
          {
            IH: { gte: IH },
            FH: { lte: FH },
          },
        ],
      },
      include: {
        section_Day: true,
      },
    });

    if (conflictingSections.length > 0) {
      return res.status(400).json({ error: 'El aula ya está ocupada dentro de esas horas y días.' });
    }

    next();
  } catch (error) {
    console.error('Error checking classroom availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const checkRegionalCenterFacultyCareerExistsAndActive = async (req: Request, res: Response, next: NextFunction) => {
  const { regionalCenter_Faculty_CareerId } = req.body;
  try {
    const existingRCFC = await prisma.regionalCenter_Faculty_Career.findUnique({
      where: { id: regionalCenter_Faculty_CareerId, active: true },
    });

    if (!existingRCFC) {
      return res.status(400).json({ error: 'El ID de la Carrera de la Facultad del Centro Regional no existe o no está activo' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const checkClassroomExists = async (req: Request, res: Response, next: NextFunction) => {
  const { classroomId } = req.body;
  try {
    const existingClassroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!existingClassroom) {
      return res.status(400).json({ error: 'El ID del aula no existe' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const checkClassroomExistsAndValidate = async (req: Request, res: Response, next: NextFunction) => {
  const { classroomId } = req.body;
  const teacherId = req.user?.id;

  try {
    // Obtener el edificio (building) del aula (classroom)
    const classroom = await prisma.classroom.findUnique({
      where: { id: Number(classroomId) },
      select: { buildingId: true },
    });

    if (!classroom) {
      return res.status(400).json({ error: 'El ID del aula no existe' });
    }

    // Obtener el centro regional (regional center) del edificio (building)
    const building = await prisma.building.findUnique({
      where: { id: classroom.buildingId },
      select: { regionalCenterId: true },
    });

    if (!building) {
      return res.status(400).json({ error: 'El edificio no existe' });
    }

    // Obtener el centro regional (regional center) del teacher (usuario autenticado)
    const teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: teacherId, active: true },
      select: { regionalCenterFacultyCareerDepartment: { select: { RegionalCenterFacultyCareer: { select: { regionalCenter_Faculty: { select: { regionalCenterId: true } } } } } } },
    });

    if (!teacher) {
      return res.status(400).json({ error: 'El maestro no existe o no está activo' });
    }

    // Verificar que el centro regional del edificio coincida con el del maestro
    if (building.regionalCenterId !== teacher.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenterId) {
      return res.status(400).json({ error: 'El aula o docente pertenece a un centro regional diferente' });
    }

    next();
  } catch (error) {
    console.error('Error checking classroom and teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkTeacherExistsAndActive = async (req: Request, res: Response, next: NextFunction) => {
  const { teacherId } = req.body;
  const misterId = req.user?.id;

  try {
    const existingTeacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: { role: true },
    });

    if (!existingTeacher || existingTeacher.roleId === 1 || existingTeacher.roleId === 5 || !existingTeacher.active) {
      return res.status(400).json({ error: 'El ID del maestro no existe, no está activo, o no tiene el rol de maestro' });
    }


    // Obtener el centro regional (regional center) del teacher (usuario mandado en el json)
    const teachercenterid = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst(
      {
        where: { teacherId: existingTeacher.id },
        select: { regionalCenterFacultyCareerDepartment: { select: { RegionalCenterFacultyCareer: { select: { regionalCenter_Faculty: { select: { regionalCenterId: true } } } } } } },
      });

    // Obtener el centro regional (regional center) del teacher (usuario autenticado)
    const teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: misterId },
      select: { regionalCenterFacultyCareerDepartment: { select: { RegionalCenterFacultyCareer: { select: { regionalCenter_Faculty: { select: { regionalCenterId: true } } } } } } },
    });

    if (teachercenterid.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenterId !== teacher.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenterId) {
      return res.status(400).json({ error: 'El maestro pertenece a un centro regional diferente' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkTeacherScheduleConflict = async (req: Request, res: Response, next: NextFunction) => {
  const { teacherId, IH, FH, days } = req.body;
  const IdPeriodo = await getPeriodoActual();
  try {
    const conflictingSections = await prisma.section.findMany({
      where: {
        teacherId,
        academicPeriodId: IdPeriodo,
        section_Day: {
          some: {
            dayId: { in: days }
          }
        },
        OR: [
          {
            IH: { lte: IH },
            FH: { gt: IH },
          },
          {
            IH: { lt: FH },
            FH: { gte: FH },
          },
          {
            IH: { gte: IH },
            FH: { lte: FH },
          },
        ],
      },
      include: {
        section_Day: true,
      },
    });

    if (conflictingSections.length > 0) {
      return res.status(400).json({ error: 'El maestro tiene otra sección programada durante estas horas y días.' });
    }

    next();
  } catch (error) {
    console.error('Error checking teacher schedule conflict:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkTeacherScheduleConflictNext = async (req: Request, res: Response, next: NextFunction) => {
  const { teacherId, IH, FH, days } = req.body;
  const idPeriodo = await getSiguientePeriodo();
  try {
    const conflictingSections = await prisma.section.findMany({
      where: {
        teacherId,
        academicPeriodId: idPeriodo,
        section_Day: {
          some: {
            dayId: { in: days }
          }
        },
        OR: [
          {
            IH: { lte: IH },
            FH: { gt: IH },
          },
          {
            IH: { lt: FH },
            FH: { gte: FH },
          },
          {
            IH: { gte: IH },
            FH: { lte: FH },
          },
        ],
      },
      include: {
        section_Day: true,
      },
    });

    if (conflictingSections.length > 0) {
      return res.status(400).json({ error: 'El maestro tiene otra sección programada durante estas horas y días.' });
    }

    next();
  } catch (error) {
    console.error('Error checking teacher schedule conflict:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkAcademicPeriodValid = async (req: Request, res: Response, next: NextFunction) => {
  const { academicPeriodId } = req.body;
  try {
    const academicPeriod = await prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
      include: {
        process: true,
      },
    });

    if (!academicPeriod) {
      return res.status(400).json({ error: 'El ID del período académico no existe' });
    }

    const { process } = academicPeriod;

    if (!process || !process.active || process.processTypeId !== 5) {
      return res.status(400).json({ error: 'El proceso no existe, no está activo o no es de tipo periodo academico (5)' });
    }

    const currentDate = new Date();

    if (currentDate < process.startDate || currentDate > process.finalDate) {
      return res.status(400).json({ error: 'La fecha actual no está dentro del rango de fechas de inicio y fin del proceso' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateTeacherId = async (req: Request, res: Response, next: NextFunction) => {
  const { teacherId } = req.params;
  try {
    const existingTeacher = await prisma.user.findFirst({
      where: {
        id: Number(teacherId),
        roleId: { in: [2, 3, 4] },
        active: true,
      },
    });

    if (!existingTeacher) {
      return res.status(400).json({ error: 'El ID del profesor no existe, no está activo o no tiene el rol de profesor' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkTeacherScheduleConflictUpdate = async (req: Request, res: Response, next: NextFunction) => {
  const { teacherId, IH, FH, days } = req.body;
  const { id: sectionId } = req.params; // Obtén el ID de la sección desde los parámetros de la ruta
  const idPeriodo = await getPeriodoActual();
  try {
    // Obtener la sección actual para comparar las horas
    const existingSection = await prisma.section.findUnique({
      where: { id: Number(sectionId) },
    });

    if (!existingSection) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Verificar conflictos solo si las horas están cambiando
    if (IH !== existingSection.IH || FH !== existingSection.FH) {
      const conflictingSections = await prisma.section.findMany({
        where: {
          teacherId,
          academicPeriodId: idPeriodo,
          id: { not: Number(sectionId) },
          section_Day: {
            some: {
              dayId: { in: days }
            }
          }, // Excluir la sección actual de la validación
          OR: [
            {
              IH: { lte: IH },
              FH: { gt: IH },
            },
            {
              IH: { lt: FH },
              FH: { gte: FH },
            },
            {
              IH: { gte: IH },
              FH: { lte: FH },
            },
          ],
        },
      });

      if (conflictingSections.length > 0) {
        return res.status(400).json({ error: 'El maestro tiene otra sección programada durante estas horas' });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking teacher schedule conflict:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkTeacherScheduleConflictUpdateNext = async (req: Request, res: Response, next: NextFunction) => {
  const { teacherId, IH, FH, days } = req.body;
  const { id: sectionId } = req.params; // Obtén el ID de la sección desde los parámetros de la ruta
  const idPeriodo = await getSiguientePeriodo();
  try {
    // Obtener la sección actual para comparar las horas
    const existingSection = await prisma.section.findUnique({
      where: { id: Number(sectionId) },
    });

    if (!existingSection) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Verificar conflictos solo si las horas están cambiando
    if (IH !== existingSection.IH || FH !== existingSection.FH) {
      const conflictingSections = await prisma.section.findMany({
        where: {
          teacherId,
          academicPeriodId: idPeriodo,
          id: { not: Number(sectionId) },
          section_Day: {
            some: {
              dayId: { in: days }
            }
          }, // Excluir la sección actual de la validación
          OR: [
            {
              IH: { lte: IH },
              FH: { gt: IH },
            },
            {
              IH: { lt: FH },
              FH: { gte: FH },
            },
            {
              IH: { gte: IH },
              FH: { lte: FH },
            },
          ],
        },
      });

      if (conflictingSections.length > 0) {
        return res.status(400).json({ error: 'El maestro tiene otra sección programada durante estas horas' });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking teacher schedule conflict:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkClassroomAvailabilityUpdate = async (req: Request, res: Response, next: NextFunction) => {
  const { IH, FH, classroomId, days } = req.body;
  const { id: sectionId } = req.params; // Obtén el ID de la sección desde los parámetros de la ruta
  const idPeriodo = await getPeriodoActual();
  try {
    // Obtener la sección actual para comparar las horas
    const existingSection = await prisma.section.findUnique({
      where: { id: Number(sectionId) },
    });

    if (!existingSection) {
      return res.status(404).json({ error: 'Section no encontrada' });
    }

    // Verificar conflictos solo si las horas o el aula están cambiando
    if (IH !== existingSection.IH || FH !== existingSection.FH || classroomId !== existingSection.classroomId) {
      const conflictingSections = await prisma.section.findMany({
        where: {
          classroomId,
          academicPeriodId: idPeriodo,
          id: { not: Number(sectionId) },
          section_Day: {
            some: {
              dayId: { in: days }
            }
          }, // Excluir la sección actual de la validación
          OR: [
            {
              IH: { lte: IH },
              FH: { gt: IH },
            },
            {
              IH: { lt: FH },
              FH: { gte: FH },
            },
            {
              IH: { gte: IH },
              FH: { lte: FH },
            },
          ],
        },
      });

      if (conflictingSections.length > 0) {
        return res.status(400).json({ error: 'El aula ya está ocupada durante estas horas' });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking classroom availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkClassroomAvailabilityUpdateNext = async (req: Request, res: Response, next: NextFunction) => {
  const { IH, FH, classroomId, days } = req.body;
  const { id: sectionId } = req.params; // Obtén el ID de la sección desde los parámetros de la ruta
  const idPeriodo = await getSiguientePeriodo();
  try {
    // Obtener la sección actual para comparar las horas
    const existingSection = await prisma.section.findUnique({
      where: { id: Number(sectionId) },
    });

    if (!existingSection) {
      return res.status(404).json({ error: 'Section no encontrada' });
    }

    // Verificar conflictos solo si las horas o el aula están cambiando
    if (IH !== existingSection.IH || FH !== existingSection.FH || classroomId !== existingSection.classroomId) {
      const conflictingSections = await prisma.section.findMany({
        where: {
          academicPeriodId: idPeriodo,
          classroomId: Number(classroomId),
          id: { not: Number(sectionId) },
          section_Day: {
            some: {
              dayId: { in: days }
            }
          }, // Excluir la sección actual de la validación
          OR: [
            {
              IH: { lte: IH },
              FH: { gt: IH },
            },
            {
              IH: { lt: FH },
              FH: { gte: FH },
            },
            {
              IH: { gte: IH },
              FH: { lte: FH },
            },
          ],
        },
      });

      if (conflictingSections.length > 0) {
        return res.status(400).json({ error: 'El aula ya está ocupada durante estas horas' });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking classroom availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserData = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Not authorized' });
    }


    // Devolver todos los datos del usuario autenticado
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const validateCapacityChange = async (req: Request, res: Response, next: NextFunction) => {
  const { increment } = req.body;
  const { id } = req.params;

  try {
    const sectionId = Number(id);

    if (isNaN(sectionId)) {
      return res.status(400).json({ error: 'Invalid section ID' });
    }

    if (isNaN(increment)) {
      return res.status(400).json({ error: 'La cantidad es inválida.' });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        classroom: true
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const matriculados = await prisma.enrollment.count({
      where: {
        sectionId: section.id,
        waitingListId: null,
        active: true
      }
    })

    const newCapacity = section.capacity + Number(increment);
    // Primero valida los matriculados
    if (matriculados > 0) {
      if (Number(increment) < 0 && newCapacity < matriculados) {
        return res.status(400).json({ error: `No se pueden disminuir ${Math.abs(Number(increment))} cupos ya que hay ${matriculados} estudiantes matriculados.` });
      }
    } else {
      // Si no hay matriculados, valida que la capacidad no sea menor que 1
      if (newCapacity < 1) {
        return res.status(400).json({ error: 'La capacidad de la sección no puede ser inferior a 1.' });
      }
    }

    next();
  } catch (error) {
    console.error('Error validating capacity change:', error);
    return res.status(500).json({ error: error.message });
  }
};









