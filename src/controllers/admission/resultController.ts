import { Request, Response } from 'express';
import { getAllInscriptions } from '../../services/admission/inscriptionService';
import { prepareCsvRecords, getCsvString } from '../../services/admission/CSVGenerateService';
import { getInscriptionResultsByDni } from '../../services/admission/resultService';

export const generateCsv = async (req: Request, res: Response) => {
  try {
    const inscriptions = await getAllInscriptions();

    if (!inscriptions.length) {
      return res.status(404).send('No se encontraron inscripciones.');
    }

    const records = prepareCsvRecords(inscriptions);
    const csvString = getCsvString(records);

    res.setHeader('Content-disposition', 'attachment; filename=results.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csvString);
  } catch (error) {
    console.error('Error al generar el CSV:', error);
    res.status(500).send('Error interno en el servidor');
  }
};

export const getInscriptionResults = async (req: Request, res: Response) => {
  const { dni } = req.params;
  console.log(req.body.resultIdActive);
  const processId = req.body.resultIdActive
  try {
    const details = await getInscriptionResultsByDni(dni, processId);
    res.json(details);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};




