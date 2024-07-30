import { Readable } from 'stream';
import csv from 'csv-parser';

export type DataCSV = {
    dni: string,
    examen: string,
    nota: string
};

export type StudentData = {
    dni: string;
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    correo_electronico: string;
    numero_telefonico : string;
    carrera_principal: string;
    carrera_secundaria: string;
    centro_regional: string;
}

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
        const readableStream = Readable.from(csvText);

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

    static processCSVAdmitteds(csvText: string) {
        const expectedHeaders = new Set(['dni', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'correo_electronico', 'numero_telefonico','carrera_principal', 'carrera_secundaria', 'centro_regional']);
        const results: StudentData[] = []
        const uniqueRecords = new Set<string>();
        const errors: string[] = [];

        // Expresiones regulares para validación
        const dniRegex = /^[0-9-\s]+$/
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/
        const correoElectronicoRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
        const phoneNumberRegex = /^([0-9]{8})|([0-9]{4}(\-|\s)[0-9]{4})$/
        const carreraPrincipalRegex = /^[a-zA-Z]+$/
        const carreraSecundariaRegex = /^[a-zA-Z]+$/
        const centroRegionalRegex = /^[a-zA-Z\-]+$/
        let count = 0

        // creando un stream a partir de una cadena 
        const readableStream = Readable.from(csvText);

        // limpiando los encabezados y valores de espacios en blanco inicio y final
        const parser = csv({
            mapHeaders: ({ header }) => header.trim().replace(/\s+/g, '_').toLowerCase(),
            mapValues: ({ value }) => value.trim()
        });


        // validando que los encabezados vengan como se espera
        parser.on('headers', (headers: string[]) => {
            const headersSet = new Set(headers.map(h => h.trim()));
            if (headersSet.size !== expectedHeaders.size || ![...headersSet].every(h => expectedHeaders.has(h))) {
                errors.push(`Encabezados inesperados: se encontró [${headers.join(', ')}], se esperaba [${[...expectedHeaders].join(', ')}]`);
            }
        });

        readableStream.pipe(parser).on('data', (data: StudentData) => {

            if (errors.length > 0) {
                return errors;
            }
            count++
            
            // Validando cada campo de la fila
            const dniValid = dniRegex.test(data.dni);
            const primerNombreValid = nombreRegex.test(data.primer_nombre);
            const segundoNombreValid = nombreRegex.test(data.segundo_nombre);
            const primerApellidoValid = nombreRegex.test(data.primer_apellido);
            const segundoApellidoValid = nombreRegex.test(data.segundo_apellido);
            const correoElectronicoValid = correoElectronicoRegex.test(data.correo_electronico);
            const phoneNumberValid = phoneNumberRegex.test(data.numero_telefonico)
            const carreraPrincipalValid = carreraPrincipalRegex.test(data.carrera_principal);
            const carreraSecundariaValid = carreraSecundariaRegex.test(data.carrera_secundaria);
            const centroRegionalValid = centroRegionalRegex.test(data.centro_regional);

            if (!dniValid || !primerNombreValid || !segundoNombreValid || !primerApellidoValid || !segundoApellidoValid || !correoElectronicoValid || !phoneNumberValid || !carreraPrincipalValid || !carreraSecundariaValid || !centroRegionalValid) {
                errors.push(`Datos inválidos en la fila: ${count}`);
                return;
            }

            // Limpiar espacios en blanco en el DNI
            const cleanedData = {
                dni: data.dni.replace(/\s+/g, '').replace(/\-/g, ''),
                primer_nombre: data.primer_nombre,
                segundo_nombre: data.segundo_nombre,
                primer_apellido: data.primer_apellido,
                segundo_apellido: data.segundo_apellido,
                correo_electronico: data.correo_electronico,
                numero_telefonico : data.numero_telefonico.replace(/\s+/g, '').replace(/\-/g, ''),
                carrera_principal: data.carrera_principal,
                carrera_secundaria: data.carrera_secundaria,
                centro_regional: data.centro_regional,
            };

            // validando que no existan datos duplicados en el CSV
            const uniqueKey = cleanedData.dni;
            if (uniqueRecords.has(uniqueKey)) {
                errors.push(`Datos duplicados para DNI: ${cleanedData.dni}`);
            } else {
                uniqueRecords.add(uniqueKey);
                results.push(cleanedData);
            }
        });

        return new Promise<{ results: StudentData[], errors: string[], uniqueRecords: Set<string> }>((resolve) => {
            parser.on('end', () => resolve({ results, errors, uniqueRecords }));
        });

    }

}
