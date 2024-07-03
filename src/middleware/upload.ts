import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

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
