import multer from 'multer';
import path from 'path';

// Configurar dónde se almacenarán los archivos temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se almacenarán los archivos temporalmente
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para cada archivo
  },
});

export const upload = multer({ storage });
