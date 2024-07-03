import { Request, Response } from 'express';
import { getAllInscriptions } from '../services/inscriptionService';
import { prepareCsvRecords, writeCsvFile } from '../services/CSVGenerateService';

export const generateCsv = async (req: Request, res: Response) => {
  try {
    const inscriptions = await getAllInscriptions();

    if (!inscriptions.length) {
      return res.status(404).send('No se encontraron inscripciones.');
    }

    const records = prepareCsvRecords(inscriptions);
    await writeCsvFile(records);

    res.download('results.csv');
  } catch (error) {
    console.error('Error al generar el CSV:', error);
    res.status(500).send('Error interno en el servidor');
  }
};



