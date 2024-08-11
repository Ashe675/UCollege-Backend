import { Request, Response } from 'express';
import { createTeacherService } from '../../services/admin/teacherService';
import { createRCFCDTService } from '../../services/admin/RCFCDTService';
import { AuthEmail } from '../../services/mail/authEmail';
import { EnrollService } from '../../services/enroll/enrollService';
import { generatePasswordUser } from '../../utils/admin/generatePassword';
import { generateIdentificationCodeEmployee } from '../../utils/admin/generateIdentificationCode';
import { prisma } from '../../config/db';
import { deleteImageFromCloud, uploadImageAdmission } from '../../utils/cloudinary';
import deleteImage from '../../utils/admission/fileHandler';
import { createImage, ImageData } from '../../services/images/createImage';
import { RoleEnum } from '@prisma/client';
import { checkActiveProcessByTypeId } from '../../middleware/checkActiveProcessGeneric';

export const createTeacher = async (req: Request, res: Response) => {

  if (!req.file) {
    return res.status(400).json({ error: 'Se requiere una foto del docente.' });
  }

  // Verificar que el archivo es una imagen
  const fileType = req.file.mimetype;
  const allowedTypes = ['image/jpg', 'image/png', 'image/webp', 'image/jpeg'];

  if (!allowedTypes.includes(fileType)) {
    await deleteImage(req.file.path)
    return res.status(400).send('El archivo subido tiene un formato de imagen válido.');
  }

  try {
    const roleSpecial = await prisma.role.findUnique({
      where: { id: parseInt(req.body.roleId) }
    });

    if (
      !(roleSpecial?.name == 'DEPARTMENT_HEAD' ||
        roleSpecial?.name == 'COORDINATOR' ||
        roleSpecial?.name == 'TEACHER')
    ) {
      await deleteImage(req.file.path)
      return res.status(400).json({ error: "El role no es valido para crear un docente" });
    }


    if (roleSpecial.name == 'DEPARTMENT_HEAD' || roleSpecial.name == 'COORDINATOR') {
      const teacherRoleSpecial = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findMany({
        where: {
          active: true,
          regionalCenter_Faculty_Career_Department_Departament_id: parseInt(req.body.departamentId),
          regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: parseInt(req.body.RegionalCenter_Faculty_Career_id),
          teacher: {
            role: {
              name: roleSpecial.name
            }
          }
        },
      });

      if (teacherRoleSpecial.length > 0) {
        await deleteImage(req.file.path)
        return res.status(400).json({ error: `Ya se encuentra un maestro con el rol de ${roleSpecial.name === 'DEPARTMENT_HEAD' ? 'Jefe de Departamento' : 'Coordinador de Carrera'} asignado al departamento.` });
      }
    }



    const teacherData = {
      dni: req.body.dni,
      firstName: req.body.firstName,
      middleName: req.body.middleName ? req.body.middleName : null,
      lastName: req.body.lastName,
      secondLastName: req.body.secondLastName ? req.body.secondLastName : null,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      roleId: parseInt(req.body.roleId),
      identificationCode: "",
      institutionalEmail: "",
      password: "",
      RegionalCenter_Faculty_Career_id: parseInt(req.body.RegionalCenter_Faculty_Career_id),
      departamentId: parseInt(req.body.departamentId)
    };

    teacherData.identificationCode = await generateIdentificationCodeEmployee();
    teacherData.institutionalEmail = await EnrollService.generateUniqueUsername(
      teacherData.firstName,
      teacherData.middleName,
      teacherData.lastName,
      teacherData.secondLastName,
      '@unah.edu.hn'
    );

    teacherData.password = await generatePasswordUser();

    let personDNI = await prisma.person.findUnique({
      where: { dni: teacherData.dni },
    });

    let personEmail = await prisma.person.findUnique({
      where: { email: teacherData.email },
    });

    if (personDNI != null && personEmail != null) {
      await deleteImage(req.file.path)
      return res.status(400).json({ error: "El DNI y email ingresado ya existen en la base de datos" });
    } else if (personDNI != null) {
      await deleteImage(req.file.path)
      return res.status(400).json({ error: "El DNI ingresado ya existe en la base de datos de una persona" });
    } else if (personEmail != null) {
      await deleteImage(req.file.path)
      return res.status(400).json({ error: "El email ingresado ya existe en la base de datos de una persona" });
    }

    const newTeacher = await createTeacherService(teacherData);

    if (newTeacher != null) {
      const newRegionalCenter_Faculty_Carrer_Department_Teacher = await createRCFCDTService(
        newTeacher.id,
        teacherData.RegionalCenter_Faculty_Career_id,
        teacherData.departamentId
      );

      if (newRegionalCenter_Faculty_Carrer_Department_Teacher != null) {
        const data = {
          email: teacherData.email,
          password: teacherData.password,
          name: teacherData.firstName,
          newEmail: teacherData.institutionalEmail,
        };

        const result = await uploadImageAdmission(req.file.path, 'userPhotos', true)
        const url = result.secure_url

        await deleteImage(req.file.path)

        const newImage: ImageData = {
          userId: newTeacher.id,
          avatar: true,
          url,
          publicId: result.public_id
        }

        await createImage(newImage);

        AuthEmail.sendPasswordAndEmail(data, true);

      } else {
        await prisma.user.delete({ where: { id: newTeacher.id } });
        return res.status(400).json({ error: 'No se creó una relación entre el maestro, el departamento y el centro regional' });
      }

    }
    return res.status(201).json({ message: "Se ha creado un nuevo maestro" });
  } catch (error) {
    await deleteImage(req.file.path)
    return res.status(500).json({ error: error.message });
  }
};


export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD']
          }
        },
      },
      include: {
        person: true,
        role: true,
        images: {
          where: {
            avatar: true
          },
          select: {
            url: true,
          }
        }
      }
    });

    // Mapea los docentes y realiza las consultas adicionales
    const formattedTeachers = await Promise.all(teachers.map(async teacher => {
      const RegionalCenter_Faculty_Career_Department_Teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: { teacherId: teacher.id }
      });

      const regionalCenter = RegionalCenter_Faculty_Career_Department_Teacher
        ? await prisma.regionalCenter_Faculty_Career.findUnique({
          where: { id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id },
          include: {
            regionalCenter_Faculty: {
              include: {
                regionalCenter: true
              }
            }
          }
        })
        : null;

      const departament = RegionalCenter_Faculty_Career_Department_Teacher
        ? await prisma.departament.findUnique({
          where: {
            id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_Departament_id
          }
        })
        : null;

      return {
        user_id: teacher.id,
        avatar: teacher.images[0] ? teacher.images[0] : null,
        firstName: teacher.person.firstName,
        middleName: teacher.person.middleName,
        lastName: teacher.person.lastName,
        secondLastName: teacher.person.secondLastName,
        regionalCenter: regionalCenter ? regionalCenter.regionalCenter_Faculty.regionalCenter.name : null,
        departament: departament ? departament.name : null,
        role: teacher.role.name,
        dni: teacher.person.dni,
        identificationCode: teacher.identificationCode
      };
    }));

    res.status(200).json(formattedTeachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los docentes' });
  }
};


// Obtener un docente por su ID
export const getTeacherById = async (req: Request, res: Response) => {
  try {
    const teacherId = parseInt(req.params.id);

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        person: true,
        role: true,
        images: true
      },
    });

    if (!teacher || !['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD'].includes(teacher.role.name)) {
      return res.status(404).json({ error: 'Docente no encontrado o no es un docente válido' });
    }

    const RegionalCenter_Faculty_Career_Department_Teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: teacher.id }
    });

    const regionalCenter = RegionalCenter_Faculty_Career_Department_Teacher
      ? await prisma.regionalCenter.findUnique({
        where: { id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id }
      })
      : null;

    const departament = RegionalCenter_Faculty_Career_Department_Teacher
      ? await prisma.departament.findUnique({
        where: {
          id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_Departament_id
        }
      })
      : null;

    const formattedTeacher = {
      user_id: teacher.id,
      firstName: teacher.person.firstName,
      middleName: teacher.person.middleName,
      lastName: teacher.person.lastName,
      secondLastName: teacher.person.secondLastName,
      regionalCenter: regionalCenter ? regionalCenter.name : null,
      departament: departament ? departament.name : null,
      role: teacher.role.name,
      dni: teacher.person.dni,
      identificationCode: teacher.identificationCode,
      images: teacher.images
    };

    res.status(200).json(formattedTeacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el docente' });
  }
};

export const getTeachersPagination = async (req: Request, res: Response) => {
  try {
    // Obtener los parámetros de paginación
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Consultar los docentes con paginación y ordenar alfabéticamente por firstName
    const teachers = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD'],
          },
        },
      },
      include: {
        person: true,
        role: true,
        images: {
          where: {
            avatar: true,
          },
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        person: {
          firstName: 'asc',
        },
      },
      skip,
      take: limit,
    });

    // Mapea los docentes y realiza las consultas adicionales
    const formattedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        const RegionalCenter_Faculty_Career_Department_Teacher =
          await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
            where: { teacherId: teacher.id },
          });

        const regionalCenter = RegionalCenter_Faculty_Career_Department_Teacher
          ? await prisma.regionalCenter_Faculty_Career.findUnique({
              where: {
                id: RegionalCenter_Faculty_Career_Department_Teacher
                  .regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id,
              },
              include: {
                regionalCenter_Faculty: {
                  include: {
                    regionalCenter: true,
                  },
                },
              },
            })
          : null;

        const departament = RegionalCenter_Faculty_Career_Department_Teacher
          ? await prisma.departament.findUnique({
              where: {
                id: RegionalCenter_Faculty_Career_Department_Teacher
                  .regionalCenter_Faculty_Career_Department_Departament_id,
              },
            })
          : null;

        return {
          user_id: teacher.id,
          avatar: teacher.images[0] ? teacher.images[0] : null,
          firstName: teacher.person.firstName,
          middleName: teacher.person.middleName,
          lastName: teacher.person.lastName,
          secondLastName: teacher.person.secondLastName,
          regionalCenter: regionalCenter
            ? regionalCenter.regionalCenter_Faculty.regionalCenter.name
            : null,
          departament: departament ? departament.name : null,
          role: teacher.role.name,
          dni: teacher.person.dni,
          identificationCode: teacher.identificationCode,
        };
      })
    );

    // Contar el total de docentes para la paginación
    const totalTeachers = await prisma.user.count({
      where: {
        role: {
          name: {
            in: ['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD'],
          },
        },
      },
    });

    res.status(200).json({
      teachers: formattedTeachers,
      pagination: {
        totalItems: totalTeachers,
        currentPage: page,
        totalPages: Math.ceil(totalTeachers / limit),
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los docentes' });
  }
};


// Obtener un docente por su DNI
export const getTeacherByDni = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;

    // Encuentra a la persona por su DNI
    const person = await prisma.person.findUnique({
      where: { dni: dni },
      include: {
        user: {
          include: {
            role: true,
            images: true
          }
        }
      }
    });

    if (!person || !person.user || !['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD'].includes(person.user.role.name)) {
      return res.status(404).json({ error: 'Docente no encontrado o no es un docente válido' });
    }

    const teacher = person.user;

    const RegionalCenter_Faculty_Career_Department_Teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: teacher.id }
    });

    const regionalCenter = RegionalCenter_Faculty_Career_Department_Teacher
      ? await prisma.regionalCenter.findUnique({
        where: { id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id }
      })
      : null;

    const departament = RegionalCenter_Faculty_Career_Department_Teacher
      ? await prisma.departament.findUnique({
        where: {
          id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_Departament_id
        }
      })
      : null;

    const formattedTeacher = {
      user_id: teacher.id,
      images: teacher.images,
      firstName: person.firstName,
      middleName: person.middleName,
      lastName: person.lastName,
      secondLastName: person.secondLastName,
      regionalCenter: regionalCenter ? regionalCenter.name : null,
      departament: departament ? departament.name : null,
      role: teacher.role.name,
      dni: person.dni,
      identificationCode: teacher.identificationCode
    };

    res.status(200).json(formattedTeacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el docente' });
  }
};

// Obtener un docente por su código de identificación
export const getTeacherByIdentificationCode = async (req: Request, res: Response) => {
  try {
    const { identificationCode } = req.params;

    // Encuentra al usuario por su código de identificación
    const teacher = await prisma.user.findUnique({
      where: { identificationCode: identificationCode },
      include: {
        person: true,
        role: true,
        images: true,
      }
    });

    if (!teacher || !['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD'].includes(teacher.role.name)) {
      return res.status(404).json({ error: 'Docente no encontrado o no es un docente válido' });
    }

    const RegionalCenter_Faculty_Career_Department_Teacher = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: teacher.id }
    });

    const regionalCenter = RegionalCenter_Faculty_Career_Department_Teacher
      ? await prisma.regionalCenter_Faculty_Career.findUnique({
        where: { id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id },
        include: {
          regionalCenter_Faculty: {
            include: {
              regionalCenter: true
            }
          }
        }
      })
      : null;

    const departament = RegionalCenter_Faculty_Career_Department_Teacher
      ? await prisma.departament.findUnique({
        where: {
          id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_Departament_id
        }
      })
      : null;

    const formattedTeacher = {
      user_id: teacher.id,
      images: teacher.images,
      firstName: teacher.person.firstName,
      middleName: teacher.person.middleName,
      lastName: teacher.person.lastName,
      secondLastName: teacher.person.secondLastName,
      regionalCenterFacultyCareer: {
        id: RegionalCenter_Faculty_Career_Department_Teacher.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id,
        name: regionalCenter.regionalCenter_Faculty.regionalCenter.name
      },
      regionalCenter: {
        id: regionalCenter.regionalCenter_Faculty_RegionalCenterId,
        name: regionalCenter.regionalCenter_Faculty.regionalCenter.name
      },
      departament: {
        id: departament.id,
        name: departament.name
      },
      role: {
        id: teacher.roleId,
        name: teacher.role.name
      },
      dni: teacher.person.dni,
      identificationCode: teacher.identificationCode,
      phoneNumber: teacher.person.phoneNumber,
      email: teacher.person.email
    };

    res.status(200).json(formattedTeacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el docente' });
  }
};

//Actualizar docente
export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const { identificationCode } = req.params;
    const { firstName, middleName, lastName, secondLastName, email, phoneNumber, roleId } = req.body;

    // Encuentra al usuario por su código de identificación
    const teacher = await prisma.user.findUnique({
      where: {
        identificationCode: identificationCode,
        role: {
          name: {
            in: ['COORDINATOR', 'TEACHER', 'DEPARTMENT_HEAD']
          }
        }
      },
      include: {
        person: true,
        role: true,
        teacherDepartments: true
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }


    const isNewEmailValid = await prisma.person.findFirst({
      where: {
        id: { not: teacher.personId },
        email: email
      }
    });

    if (isNewEmailValid) {
      return res.status(400).json({ error: "El email a actualizar no es valido, ya existe" });
    }

    // Actualizar la persona asociada
    await prisma.person.update({
      where: { id: teacher.personId },
      data: {
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        secondLastName: secondLastName,
        email: email,
        phoneNumber: phoneNumber,
      }
    });

    res.status(200).json({ message: 'Docente actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el docente' });
  }
};


//Eliminar docente
export const deleteTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Verificar si hay un periodo académico activo
    const process = await checkActiveProcessByTypeId(5);
    if (process) {
      return res.status(400).json({ error: `No se puede desactivar el docente ya que hay un periodo académico activo.` });
    }

    // Buscar el docente por su ID
    const teacher = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
        role: {
          name: {
            in: ['TEACHER', 'COORDINATOR', 'DEPARTMENT_HEAD']
          }
        },
        active: true,
      },
      include: {
        person: true,
        teacherDepartments: true,
        images: true, // Incluye imágenes si se manejan en esta relación
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Docente no encontrado o no está activo.' });
    }

    // Eliminar imágenes asociadas al docente de la nube
    if (teacher.images && teacher.images.length) {
      for (const image of teacher.images) {
        try {
          await deleteImageFromCloud(image.publicId);
        } catch (error) {
          console.error(`Error al eliminar imagen de la nube: ${image.publicId}`, error);
          
        }
      }
    }

    // Eliminar el usuario y todas las relaciones asociadas en cascada
    await prisma.user.delete({
      where: {
        id: teacher.id,
      },
    });

    res.status(200).json({ message: 'Docente eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el docente.' });
  }
};

//Desactiva al docente
export const desactiveTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const process = await checkActiveProcessByTypeId(5);
    if (process) {
      return res.status(400).json({ error: `No se puede desactivar el docente ya que hay un periodo académico activo.` });
    }

    // Buscar el docente por su código de identificación
    const teacher = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
        role: {
          name: {
            in: ['TEACHER', 'COORDINATOR', 'DEPARTMENT_HEAD']
          }
        },
        active: true,
      },
      include: {
        person: true,
        teacherDepartments: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Docente no encontrado o no esta activo' });
    }

    // Verificar si el registro en la tabla Person existe antes de eliminarlo
    const personExists = await prisma.person.findUnique({
      where: {
        id: teacher.personId,
      },
    });

    if (personExists) {

      let roleTeacher = await prisma.role.findFirst({where:{name:"TEACHER"}})
      await prisma.user.update({
        where: {
          id: teacher.id,
        },
        data:{
          active: false,
          roleId: roleTeacher.id
        }
      });
    } else {
      throw new Error(`No se encontró la persona con id: ${teacher.personId}`);
    }

    res.status(200).json({ message: 'Docente desactivado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar el docente' });
  }
};

//Activar al docente
export const activateTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const process = await checkActiveProcessByTypeId(5);
    if (process) {
      return res.status(400).json({ error: `No se puede activar el docente ya que hay un periodo académico activo.` });
    }

    // Buscar el docente por su código de identificación
    const teacher = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
        role: {
          name: {
            in: ['TEACHER', 'COORDINATOR', 'DEPARTMENT_HEAD']
          }
        },
        active: false,
      },
      include: {
        person: true,
        teacherDepartments: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Docente no encontrado o no esta desactivo' });
    }

    // Verificar si el registro en la tabla Person existe antes de eliminarlo
    const personExists = await prisma.person.findUnique({
      where: {
        id: teacher.personId,
      },
    });

    if (personExists) {

      await prisma.user.update({
        where: {
          id: teacher.id,
        },
        data:{
          active: true
        }
      });
    } else {
      throw new Error(`No se encontró la persona con id: ${teacher.personId}`);
    }

    res.status(200).json({ message: 'Docente activado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al activar el docente' });
  }
};


//Actualizar centro o departamento del docente
export const updateTeacherCenters = async (req: Request, res: Response) => {
  const { teacherCode } = req.params;
  const { RegionalCenter_Faculty_Career_id, departamentId, roleId } = req.body;


  try {

    const process = await checkActiveProcessByTypeId(5);
    if (process) {
      return res.status(400).json({ error: `No se puede cambiar de centro ya que hay un periodo académico activo.` });
    }


    // Validar que el docente exista
    const teacher = await prisma.user.findUnique({
      where: { identificationCode: teacherCode },
      include: { teacherDepartments: true }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

    let roleSpecial = await prisma.role.findUnique({
      where: {
        id: parseInt(roleId),
      }
    });

    if (
      !(roleSpecial.name == 'DEPARTMENT_HEAD' ||
        roleSpecial.name == 'COORDINATOR' ||
        roleSpecial.name == 'TEACHER')
    ) {
      //await deleteImage(req.file.path)
      return res.status(400).json({ error: "El role no es valido para editar a un docente" });
    }

    if (roleSpecial.name == 'DEPARTMENT_HEAD' || roleSpecial.name == 'COORDINATOR') {
      const teacherRoleSpecial = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findMany({
        where: {
          active: true,
          regionalCenter_Faculty_Career_Department_Departament_id: parseInt(req.body.departamentId),
          regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: parseInt(req.body.RegionalCenter_Faculty_Career_id),
          teacher: {
            id: { not: teacher.id },
            role: {
              name: roleSpecial.name
            }
          }
        },
      });
      if (teacherRoleSpecial.length > 0) {
        //await deleteImage(req.file.path)
        return res.status(400).json({ error: `Ya existe un docente asignado a ${roleSpecial.name === RoleEnum.DEPARTMENT_HEAD ? 'Jefe de Departametno' : 'Coordinador de Carrera'} en el departamento.` });
      }

    }


    // Actualizar las relaciones en la tabla RegionalCenter_Faculty_Career_Department_Teacher
    await prisma.$transaction(async (transaction) => {
      // Verifica si ya existe una relación para el docente
      const existingRelation = await transaction.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
        where: {
          teacherId: teacher.id,
          regionalCenter_Faculty_Career_Department_Departament_id: teacher.teacherDepartments[0]?.regionalCenter_Faculty_Career_Department_Departament_id,
          regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: teacher.teacherDepartments[0]?.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id
        }
      });

      if (existingRelation) {
        // Actualizar la relación existente
        await transaction.regionalCenter_Faculty_Career_Department_Teacher.update({
          where: {
            teacherId_regionalCenter_Faculty_Career_Department_Departament_id_regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: {
              teacherId: teacher.id,
              regionalCenter_Faculty_Career_Department_Departament_id: existingRelation.regionalCenter_Faculty_Career_Department_Departament_id,
              regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: existingRelation.regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id
            }
          },
          data: {
            regionalCenter_Faculty_Career_Department_Departament_id: departamentId,
            regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: RegionalCenter_Faculty_Career_id
          }
        });
        await transaction.user.update({
          where: {
            id: teacher.id
          },
          data: {
            role: {
              connect: {
                id: parseInt(roleId) // Reemplaza roleId con el ID del rol que deseas asignar
              }
            }
          }
        });
      } else {
        // Crear una nueva relación si no existe
        await transaction.regionalCenter_Faculty_Career_Department_Teacher.create({
          data: {
            teacherId: teacher.id,
            regionalCenter_Faculty_Career_Department_Departament_id: departamentId,
            regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: RegionalCenter_Faculty_Career_id
          }
        });

        await transaction.user.update({
          where: {
            id: teacher.id
          },
          data: {
            role: {
              connect: {
                id: parseInt(roleId) // Reemplaza roleId con el ID del rol que deseas asignar
              }
            }
          }
        });
      }
    });

    res.status(200).json({ message: '¡EL docente se actualizó exitosamente!' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el centro regional y departamento' });
  }
};