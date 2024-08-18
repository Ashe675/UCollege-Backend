import { v2 as cloudinary } from 'cloudinary';

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

export async function deleteImageFromCloud(publicId : string) {
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new Error('Error al eliminar la imagen en Cloudinary');
    }
}

