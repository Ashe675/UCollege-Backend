import { Request, Response } from 'express';
import { createTeacherService } from '../../services/admin/teacherService';
import { AuthEmail } from '../../services/mail/authEmail';
import { prisma } from '../../config/db';

export const createTeacher = async (req: Request, res: Response) => {
    try {
        const teacherData = req.body;
        

        let personDNI = await prisma.person.findUnique({
            where: { dni: teacherData.dni },
            });

        let personEmail = await prisma.person.findUnique({
            where: { email: teacherData.email },
            });

        let userInstEmail = await prisma.user.findUnique({
            where: { institutionalEmail: teacherData.institutionalEmail },
            });

        let userIdentifiedCode = await prisma.user.findUnique({
            where: {identificationCode: teacherData.identificationCode},
        });

        if(personDNI != null && personEmail != null){
            throw new Error("El DNI y email ingresado ya exixte en la base de datos");
        }
        else if(personDNI != null){
            throw new Error("El DNI ingresado ya exixte en la base de datos de una persona");
        }else if(personEmail != null){
            throw new Error("El email ingresado ya exixte en la base de datos de una persona");
        }

        if(userInstEmail != null && userIdentifiedCode != null){
            throw new Error("El correo institucional y el codigo de identificacion ingresado ya exixte en la base de datos de los usuarios");
        }else if(userIdentifiedCode != null){
            throw new Error("El Codigo de identificacion ingresado ya exixte en la base de datos de los usuarios");
        }else if(userInstEmail != null){
            throw new Error("El correo institucional ingresado ya exixte en la base de datos de los usuarios");
        }
        
        const newTeacher = await createTeacherService(teacherData);

        if(newTeacher != null){

            const data = {
                email: teacherData.email,
                password: newTeacher.password,
                name: teacherData.firstName,
            };
            AuthEmail.sendPasswordAndEmail(data, true);
        }
        
        res.status(201).json({message: "Se a creado un nuevo maestro"});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
