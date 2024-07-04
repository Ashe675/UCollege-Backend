import { Readable } from 'stream';
import csv from 'csv-parser';

export type DataCSV = {
    dni: string,
    examen: string,
    nota: string
};

export class CSVService {
    static processCSV = (csvText: string) => {
        const expectedHeaders = new Set(['dni', 'examen', 'nota']);
        const results: DataCSV[] = []
        const uniqueRecords = new Set<string>();
        const errors: string[] = [];

        // Expresiones regulares para validación
        const dniRegex = /^[0-9-\s]+$/
        const examenRegex = /^[a-zA-Z\s]+$/
        const notaRegex = /^\s*[0-9]{1,4}\s*$/
        let count = 0

        // creando un stream a partir de una cadena 
        const readableStream = Readable.from(csvText.split('\n'));

        // limpiando los encabezados y valores de espacios en blanco inicio y final
        const parser = csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase(),
            mapValues: ({ value }) => value.trim()
        });

        // validando que los encabezados vengan como se espera
        parser.on('headers', (headers: string[]) => {
            const headersSet = new Set(headers.map(h => h.trim()));
            if (headersSet.size !== expectedHeaders.size || ![...headersSet].every(h => expectedHeaders.has(h))) {
                errors.push(`Encabezados inesperados: se encontró [${headers.join(', ')}], se esperaba [${[...expectedHeaders].join(', ')}]`);
            }
        });

        readableStream.pipe(parser).on('data', (data: DataCSV) => {
            if (errors.length > 0) {
                return errors;
            }
            count++

            // Validando cada campo de la fila
            const dniValid = dniRegex.test(data.dni);
            const examenValid = examenRegex.test(data.examen);
            const notaValid = notaRegex.test(data.nota);

            if (!dniValid || !examenValid || !notaValid) {
                errors.push(`Datos inválidos en la fila: ${count}`);
                return;
            }

            // limpiando de espacion o guiones en el dni
            const cleanedData: DataCSV = {
                dni: data.dni.replace(/\s+/g, '').replace(/\-/g, ''),
                examen: data.examen.trim(),
                nota: data.nota.trim()
            };

            // validando que no existan datos duplicados en el CSV
            const uniqueKey = `${cleanedData.dni}-${cleanedData.examen}`;
            if (uniqueRecords.has(uniqueKey)) {
                errors.push(`Datos duplicados para DNI: ${cleanedData.dni}, Exam: ${cleanedData.examen}`);
            } else {
                uniqueRecords.add(uniqueKey);
                results.push(cleanedData);
            }
        });

        return new Promise<{ results: DataCSV[], errors: string[], uniqueRecords: Set<string> }>((resolve) => {
            parser.on('end', () => resolve({ results, errors, uniqueRecords }));
        });
    }
}
