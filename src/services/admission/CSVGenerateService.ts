import { createObjectCsvStringifier } from 'csv-writer';
import { prisma } from "../../config/db" // Asegúrate de importar correctamente tu instancia de Prisma

const generateRandomScore = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const prepareCsvRecords = async (inscriptions: any[]) => {
  const records = [];
  const processedExamsByDni = new Map();

  for (const inscription of inscriptions) {
    const dni = inscription.person.dni;

    // Verificar si el usuario ya tiene resultados en la base de datos
    const existingResults = await prisma.result.findMany({
      where: {
        inscriptionId: inscription.id,
        score : { not : null }
      },
    });

    if (existingResults.length === 0) {
      if (!processedExamsByDni.has(dni)) {
        processedExamsByDni.set(dni, new Set());
      }

      const processedExams = processedExamsByDni.get(dni);

      const careers = [
        ...inscription.principalCareer.admissionsTests,
        ...inscription.secondaryCareer.admissionsTests,
      ];

      for (const admissionTestCareer of careers) {
        const examCode = admissionTestCareer.admissionTest.code;
        if (!processedExams.has(examCode)) {
          processedExams.add(examCode);

          const score = generateRandomScore(
            0,
            Math.ceil(admissionTestCareer.admissionTest.score)
          );

          records.push({
            dni,
            exam: examCode,
            score,
          });
        }
      }
    }
  }

  return records;
};

export const getCsvString = (records: any[]) => {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'score', title: 'Nota' },
      { id: 'exam', title: 'Examen' },
      { id: 'dni', title: 'DNI' },
    ],
  });

  const header = csvStringifier.getHeaderString();
  const recordsString = csvStringifier.stringifyRecords(records);

  return header + recordsString;
};


