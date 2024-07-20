import { Request, Response } from "express";
import { CSVService } from "../../services/admission/CSVService";
import { GradeService } from "../../services/admission/GradeService";
import { sendEmailResults } from "../../services/mail/emailService";
import { prisma } from "../../config/db";

export class GradeController {
    static readGrades = async (req: Request, res: Response) => {
         // Verificar que se subió el archivo
         if (!req.file) {
            return res.status(400).send('No se subió ningún archivo.');
        }

        // Verificar que el archivo es un CSV
        const fileType = req.file.mimetype;
        if (fileType !== 'text/csv') {
            return res.status(400).send('El archivo subido no es un archivo CSV.');
        }

        const processResultId = req.processResult.id

        try {

            const { results, errors } = await CSVService.processCSV(req.file.buffer.toString('utf8'));

            if (errors.length > 0) {
                throw new Error(errors[0])
            }


            for (const [index, result] of results.entries()) {
                await GradeService.validateAndSaveResult(result, index, processResultId);
            }

            await GradeService.updateInscriptions(processResultId);

            res.status(200).send('¡NOTAS SUBIDAS CORRECTAMENTE!');
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    }

    static sendEmailsGrades= async (req: Request, res: Response) => {
        const processResultId = req.processResult.id
        try {
            const grades = await GradeService.getGrades(processResultId)
            for (const grade of grades) {
                await sendEmailResults(grade)
                await prisma.inscription.update({
                    where : {
                        id : grade.id
                    },
                    data : {
                        notificated : true
                    }
                })
            }
            res.status(200).send('¡Correos Enviados Correctamente!')
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    }
}
