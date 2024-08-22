import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure : true 
});


export async function uploadImageAdmission(filePath : string, folder : string, isSquare : boolean) {
    return await cloudinary.uploader.upload(filePath, {
        allowed_formats : ['png', 'webp', 'jpg'],
        folder : folder,
        transformation: isSquare ? [{ width: 600, height: 600, crop: 'fill' }] : []
    });
}

export async function uploadPdf(fileBuffer: Buffer, originalName: string) {
    if (!fileBuffer) {
        throw new Error('El archivo no contiene datos.');
    }

    // Guardar el archivo en una ubicación temporal
    const tempFilePath = path.join(__dirname, 'temp', originalName);
    
    // Asegúrate de que el directorio temporal exista
    if (!fs.existsSync(path.dirname(tempFilePath))) {
        fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    }

    // Escribir el buffer en el archivo temporal
    fs.writeFileSync(tempFilePath, fileBuffer);

    try {
        // Subir el archivo a Cloudinary
        const result = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: 'raw', // Especifica que se trata de un archivo que no es imagen ni video
            folder: 'SOLICITUDES_RESOURCES',
            allowed_formats: ['pdf'],
        });

        // Eliminar el archivo temporal después de la subida
        fs.unlinkSync(tempFilePath);

        return result;
    } catch (error) {
        console.error('Error al subir el archivo a Cloudinary:', error);
        
        // Asegúrate de eliminar el archivo en caso de error
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        throw error;
    }
}

export async function deleteImageFromCloud(publicId : string) {
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new Error('Error al eliminar la imagen en Cloudinary');
    }
}

