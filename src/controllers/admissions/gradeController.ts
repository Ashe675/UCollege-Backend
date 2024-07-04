import { Request, Response } from "express";
import { CSVService } from "../../services/admissions/CSVService";
import { GradeService } from "../../services/admissions/GradeService";
import { sendEmailResults } from "../../services/admissions/emailService";


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

        try {

            const { results, errors } = await CSVService.processCSV(req.file.buffer.toString('utf8'));

            if (errors.length > 0) {
                return res.status(400).json({ errors });
            }


            for (const [index, result] of results.entries()) {
                await GradeService.validateAndSaveResult(result, index);
            }

            await GradeService.updateInscriptions();

            res.status(200).send('¡NOTAS SUBIDAS CORRECTAMENTE!');
            sendEmailResults('jcerratoj@unah.hn')
            sendEmailResults('josecerrato675@gmail.com')
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    }
}
