import { Request, Response } from 'express';
import { createTeacherService } from '../../services/admin/teacherService';
import { AuthEmail } from '../../services/mail/authEmail';
import { EnrollService } from '../../services/enroll/enrollService';

import { generatePasswordUser } from '../../utils/admin/generatePassword';
import {generateIdentificationCodeEmployee} from '../../utils/admin/generateIdentificationCode'

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
        };

        teacherData.identificationCode = await generateIdentificationCodeEmployee();
        teacherData.institutionalEmail = await EnrollService.generateUniqueUsername(
            teacherData.firstName, 
            teacherData.middleName,
            teacherData.lastName,
            teacherData.secondLastName,
            '@unah.edu.hn'
        )

        teacherData.password = await generatePasswordUser();

        
        

        let personDNI = await prisma.person.findUnique({
            where: { dni: teacherData.dni },
            });

        let personEmail = await prisma.person.findUnique({
            where: { email: teacherData.email },
            });

       

        if(personDNI != null && personEmail != null){
            throw new Error("El DNI y email ingresado ya exixte en la base de datos");
        }
        else if(personDNI != null){
            throw new Error("El DNI ingresado ya exixte en la base de datos de una persona");
        }else if(personEmail != null){
            throw new Error("El email ingresado ya exixte en la base de datos de una persona");
        }

       
        

        const newTeacher = await createTeacherService(teacherData);

        if(newTeacher != null){

            const data = {
                email: teacherData.email,
                password: teacherData.password,
                name: teacherData.firstName,
                newEmail: teacherData.institutionalEmail,
            };
            AuthEmail.sendPasswordAndEmail(data, true);
        }
        
        res.status(201).json({message: "Se a creado un nuevo maestro"});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
