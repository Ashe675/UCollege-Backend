import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

/**
 * Middleware de Multer para manejar la carga de archivos.
 * 
 * Esta configuración de Multer realiza las siguientes acciones:
 * 
 * 1. **Almacenamiento**:
 *    - Define el directorio `uploads/` como el destino donde se almacenarán las imágenes.
 *    - Genera un nombre de archivo único para cada imagen cargada, combinando el nombre del campo, un sufijo único basado en la fecha y una extensión de archivo.
 * 
 * 2. **Filtro de archivos**:
 *    - Acepta solo archivos de imagen (mimetype que comienza con 'image/').
 *    - Rechaza otros tipos de archivos.
 * 
 * 3. **Límites**:
 *    - Establece un límite de tamaño de archivo de 5MB.
 * 
 */


// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directorio donde se almacenarán las imágenes
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Aceptar solo archivos de imagen
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false); // Ajustar esto para evitar el error de tipo
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Limite de tamaño 5MB
});

export default upload;
