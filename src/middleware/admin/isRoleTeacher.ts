import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db";

export const isRoleTeacher = async (req: Request, res: Response, next: NextFunction) => {
  const { roleName } = req.body;
  const {identificationCode} = req.params

  

  try {
    // Buscar usuario por código de identificación y rol
    const teacherUser = await prisma.user.findUnique({
      where: {
        identificationCode: identificationCode
      },
      include: {
        person: true,
        role: true
      }
    });

    // Verificar que es docente
    if (!teacherUser || !['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD'].includes(teacherUser.role.name)) {
      return res.status(404).json({ error: "El usuario a cambiar rol no es docente." });
    }

    // Buscar el departamento del usuario y el regionalCenter_Faculty_CareerId
    const teacherDepartmentInfo = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: {
        teacherId: teacherUser.id,
        active: true,
      },
      include: {
        regionalCenterFacultyCareerDepartment: true
      }
    });

    // Verificar si se encontró el registro
    if (!teacherDepartmentInfo) {
      return res.status(404).json({ error: "No se encontró información del departamento para el usuario." });
    }

    const departmentIdInt = teacherDepartmentInfo.regionalCenterFacultyCareerDepartment.departmentId;
    const facultyCareerIdInt = teacherDepartmentInfo.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;

    if (isNaN(departmentIdInt) || isNaN(facultyCareerIdInt)) {
      return res.status(400).json({ error: "IDs de departamento y facultad/carrera no válidos." });
    }

    const roleSpecial = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!roleSpecial) {
      return res.status(400).json({ error: "El rol no existe." });
    }

    if (
      roleSpecial.name !== 'DEPARTMENT_HEAD' &&
      roleSpecial.name !== 'COORDINATOR' &&
      roleSpecial.name !== 'TEACHER'
    ) {
      return res.status(400).json({ error: "El rol no es válido para el cambio de rol." });
    }

    // Si el rol es DEPARTMENT_HEAD o COORDINATOR, verificar si ya existe un maestro con ese rol en el departamento
    if (roleSpecial.name === 'DEPARTMENT_HEAD' || roleSpecial.name === 'COORDINATOR') {
      const teacherRoleSpecial = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findMany({
        where: {
          active: true,
          regionalCenter_Faculty_Career_Department_Departament_id: departmentIdInt,
          RegionalCenter_Faculty_Career_id: facultyCareerIdInt,
          teacher: {
            role: {
              name: roleSpecial.name
            }
          }
        },
      });

      if (teacherRoleSpecial.length > 0) {
        return res.status(400).json({
          error: `Ya existe un maestro con el rol de ${roleSpecial.name === 'DEPARTMENT_HEAD' ? 'Jefe de Departamento' : 'Coordinador de Carrera'} asignado al departamento.`
        });
      }
    }

    next();
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Ocurrió un error al validar si el rol era válido para el cambio de rol." });
  }
};
