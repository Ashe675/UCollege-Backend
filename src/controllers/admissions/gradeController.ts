import { Request, Response } from "express";
import { CSVService } from "../../services/CSVService";
import { GradeService } from "../../services/GradeService";


export class GradeController {
    static readGrades = async (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).send('No se subió ningún archivo.');
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

            res.status(200).send('CSV data has been processed.');
            console.log('jajajja')
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    }
}
