import { createObjectCsvWriter } from 'csv-writer';

const generateRandomScore = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const prepareCsvRecords = (inscriptions: any[]) => {
  const records = [];

  for (const inscription of inscriptions) {
    const careers = [
      ...inscription.principalCareer.admissionsTests,
      ...inscription.secondaryCareer.admissionsTests,
    ];

    for (const admissionTestCareer of careers) {
      const score = generateRandomScore(
        0,
        Math.ceil(admissionTestCareer.admissionTest.score)
      );

      records.push({
        dni: inscription.person.dni,
        exam: admissionTestCareer.admissionTest.code,
        score,
      });
    }
  }

  return records;
};

export const writeCsvFile = async (records: any[]) => {
  const csvWriter = createObjectCsvWriter({
    path: 'results.csv',
    header: [
      { id: 'score', title: 'Nota' },
      { id: 'exam', title: 'Examen' },
      { id: 'dni', title: 'DNI' },
    ],
  });

  await csvWriter.writeRecords(records);
};
