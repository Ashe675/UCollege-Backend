import fs from 'fs';
import path from 'path';

/**
 * Elimina un archivo de imagen dado su nombre.
 * 
 * @param {string} fileName - El nombre del archivo a eliminar.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando el archivo es eliminado.
 */
const deleteImage = (fileName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '../..', '', fileName);
    

    fs.unlink(filePath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

export default deleteImage;
