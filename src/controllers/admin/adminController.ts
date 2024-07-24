import { Request, Response } from 'express';
import { createTeacherService } from '../../services/admin/teacherService';
import { createRCFCDTService } from '../../services/admin/RCFCDTService';
import { AuthEmail } from '../../services/mail/authEmail';
import { EnrollService } from '../../services/enroll/enrollService';
import { generatePasswordUser } from '../../utils/admin/generatePassword';
import { generateIdentificationCodeEmployee } from '../../utils/admin/generateIdentificationCode';
import { prisma } from '../../config/db';

export const createTeacher = async (req: Request, res: Response) => {
    try {
        

        const roleSpecial = await prisma.role.findUnique({
            where:{id: parseInt(req.body.roleId)}
        });

        if(
            !(roleSpecial.name == 'DEPARTMENT_HEAD' || 
            roleSpecial.name == 'COORDINATOR' ||
            roleSpecial.name == 'TEACHER')
        ){
            return res.status(400).json({ error: "El roleId no es valido para crear un docente" });
        }


        if(roleSpecial.name == 'DEPARTMENT_HEAD' || roleSpecial.name =='COORDINATOR'){
            const teacherRoleSpecial = await prisma.user.findMany({
                where:{
                    roleId: roleSpecial.id,
                    active: true
                },
                
            });

            if(teacherRoleSpecial.length > 0){
                return res.status(400).json({ error: `Ya esxite un usuario activo con el rol de ${roleSpecial.name}` });
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
            roleId: req.body.roleId,
            identificationCode: "",
            institutionalEmail: "",
            password: "",
            RegionalCenter_Faculty_Career_id: req.body.RegionalCenter_Faculty_Career_id,
            departamentId: req.body.departamentId
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
            return res.status(400).json({ error: "El DNI y email ingresado ya existen en la base de datos" });
        } else if (personDNI != null) {
            return res.status(400).json({ error: "El DNI ingresado ya existe en la base de datos de una persona" });
        } else if (personEmail != null) {
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
                AuthEmail.sendPasswordAndEmail(data, true);
            } else {
                await prisma.user.delete({ where: { id: newTeacher.id } });
                return res.status(400).json({ error: 'No se creó una relación entre el maestro, el departamento y el centro regional' });
            }
        }

        return res.status(201).json({ message: "Se ha creado un nuevo maestro" });
    } catch (error) {
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
          avatar: teacher.avatar,
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
        avatar: teacher.avatar,
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