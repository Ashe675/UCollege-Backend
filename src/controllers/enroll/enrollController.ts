import { Request, Response } from "express"
import { EnrollService } from "../../services/enroll/enrollService"
import { CSVService } from '../../services/admission/CSVService';

export class EnrollController {
    static async selectCareer (req : Request, res:Response) {
        const optionId : number = +req.body.optionId
        try {
            await EnrollService.enrollStudentCareer(optionId, req.user.id)

            res.send('¡Carrera Seleccionada Exitosamente!')
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }

    static async readCSVStudentsAdmitteds(req: Request, res : Response){
         // Verificar que se subió el archivo
         if (!req.files) {
            return res.status(400).send('No se subió ningún archivo.');
        }

        // Verificar que solo se suba un archivo
        if(req.files && req.files.length !== 1){
            return res.status(400).send('Solo se puede subir un archivo.');
        }

        // Verificar que el archivo es un CSV
        const fileType = req.files[0].mimetype;
        if (fileType !== 'text/csv') {
            return res.status(400).send('El archivo subido no es un archivo CSV.');
        }

        const csvText = req.files[0].buffer.toString('utf8')

        try {
            const {results, errors} =  await CSVService.processCSVAdmitteds(csvText)
            console.log(errors)
            if (errors.length > 0) {
                throw new Error(errors[0])
            }
            await EnrollService.createUsersStudents(results)

            res.send("¡Estudiantes ingresados correctamente, correos con sus credenciales enviados! ")
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }
}