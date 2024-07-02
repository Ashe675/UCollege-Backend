import csv from "csv-parser";
import fs from 'fs'

export function readCSV(url : string) {
    const results = [];
    fs.createReadStream(url)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            console.log(results);
            
    });
}


