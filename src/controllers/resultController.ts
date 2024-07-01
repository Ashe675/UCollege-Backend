import { Request, Response } from 'express';
import { getResultsByDate } from '../services/resultService';
import { createObjectCsvWriter } from 'csv-writer';

export const generateCsv = async (req: Request, res: Response) => {
  const { date } = req.body;

  try {
    const results = await getResultsByDate(date);

    if (!results.length) {
      return res.status(404).send('No results found for the given date.');
    }

    const csvWriter = createObjectCsvWriter({
      path: 'results.csv',
      header: [
        { id: 'firstName', title: 'First Name' },
        { id: 'lastName', title: 'Last Name' },
        { id: 'dni', title: 'DNI' },
        { id: 'principalCareer', title: 'Principal Career' },
        { id: 'secondaryCareer', title: 'Secondary Career' },
        { id: 'admissionTest', title: 'Admission Test' },
        { id: 'score', title: 'Score' },
        { id: 'message', title: 'Message' },
        { id: 'date', title: 'Date' },
      ],
    });

    const records = results.map(result => ({
      firstName: result.inscription.person.firstName,
      lastName: result.inscription.person.lastName,
      dni: result.inscription.person.dni,
      principalCareer: result.inscription.principalCareer.name,
      secondaryCareer: result.inscription.secondaryCareer.name,
      admissionTest: result.admissionTest.name,
      score: result.score,
      message: result.message,
      date: result.date.toISOString().split('T')[0],
    }));

    await csvWriter.writeRecords(records);

    res.download('results.csv');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

