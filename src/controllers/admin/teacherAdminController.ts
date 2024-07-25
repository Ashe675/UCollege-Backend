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
      !(roleSpecial.name == 'DEPARTMENT_HEAD' ||
        roleSpecial.name == 'COORDINATOR' ||
        roleSpecial.name == 'TEACHER')
    ) {
      await deleteImage(req.file.path)
      return res.status(400).json({ error: "El roleId no es valido para crear un docente" });
    }


    if (roleSpecial.name == 'DEPARTMENT_HEAD' || roleSpecial.name == 'COORDINATOR') {
      const teacherRoleSpecial = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findMany({
        where: {
          active: true,
          regionalCenter_Faculty_Career_Department_Departament_id: parseInt(req.body.departamentId),
          regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id:parseInt(req.body.RegionalCenter_Faculty_Career_id),
          teacher: {
            role: {
              name: roleSpecial.name
            }
          }
        },
      });

      if (teacherRoleSpecial.length > 0) {
        await deleteImage(req.file.path)
        return res.status(400).json({ error: `Ya esxite un usuario activo con el rol de ${roleSpecial.name} en el departamento.` });
      }
    }



    const teacherData = {
      dni: req.body.dni,
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      secondLastName: req.body.secondLastName,
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
        
        const result = await uploadImageAdmission(req.file.path, 'userPhotos')
        const url = result.secure_url

        await deleteImage(req.file.path)

        const newImage : ImageData = {
          userId : newTeacher.id,
          avatar : true,
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
          where : {
            avatar : true
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

      return {
        user_id: teacher.id,
        avatar: teacher.images[0] ? teacher.images[0] : null,
        firstName: teacher.person.firstName,
        middleName: teacher.person.middleName,
        lastName: teacher.person.lastName,
        secondLastName: teacher.person.secondLastName,
        regionalCenter: regionalCenter ? regionalCenter.name : null,
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
      firstName: teacher.person.firstName,
      middleName: teacher.person.middleName,
      lastName: teacher.person.lastName,
      secondLastName: teacher.person.secondLastName,
      regionalCenter: regionalCenter ? regionalCenter.name : null,
      departament: departament ? departament.name : null,
      role: teacher.role.name,
      dni: teacher.person.dni,
      identificationCode: teacher.identificationCode
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

    const roleSpecial = await prisma.role.findUnique({
      where: { id: parseInt(roleId) }
    });

    if (
      !(roleSpecial.name == 'DEPARTMENT_HEAD' ||
        roleSpecial.name == 'COORDINATOR' ||
        roleSpecial.name == 'TEACHER')
    ) {
      return res.status(400).json({ error: "El roleId no es valido para actualizar un docente" });
    }


    if (roleSpecial.name == 'DEPARTMENT_HEAD' || roleSpecial.name == 'COORDINATOR') {
      const teacherRoleSpecial = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findMany({
        where: {
          active: true,
          regionalCenter_Faculty_Career_Department_Departament_id: { in: teacher.teacherDepartments.map(department => department.regionalCenter_Faculty_Career_Department_Departament_id) },
          teacher: {
            id: { not: teacher.id },
            role: {
              name: roleSpecial.name
            }
          }
        },
      });

      if (teacherRoleSpecial.length > 0) {
        return res.status(400).json({ error: `Ya existe un usuario activo con el rol de ${roleSpecial.name} considere desactivar a ese usuario, cambiar de rol o eliminarlo para poder actualizar con este rol` });
      }
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


    // Actualizar el rol del usuario
    await prisma.user.update({
      where: { id: teacher.id },
      data: {
        roleId: roleId,
      }
    });




    res.status(200).json({ message: 'Docente actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el docente' });
  }
};


//Eliminar Docente
export const deleteTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Buscar el docente por su código de identificación
    const teacher = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
        role: {
          name: {
            in: ['TEACHER', 'COORDINATOR', 'DEPARTMENT_HEAD']
          }
        }
      },
      include: {
        person: true,
        teacherDepartments: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

     // Verificar si el registro en la tabla Person existe antes de eliminarlo
     const personExists = await prisma.person.findUnique({
      where: {
        id: teacher.personId,
      },
    });

    if (personExists) {

      const images =  await prisma.image.findMany({ where : { userId : teacher.id } })

      if (images.length){
        for(const image of images){
            const result = await deleteImageFromCloud(image.publicId)
        }
      }

      await prisma.person.delete({
        where: {
          id: teacher.personId,
        },
      });
    } else {
      throw new Error(`No se encontró la persona con id: ${teacher.personId}`);
    }
   
    res.status(200).json({ message: 'Docente eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el docente' });
  }
};