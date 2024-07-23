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
        const teacherData = {
            dni: req.body.dni,
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            secondLastName: req.body.secondLastName,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            roleId: 2,
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
