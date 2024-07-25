import { v2 as cloudinary } from 'cloudinary';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure : true 
});


export async function uploadImageAdmission(filePath : string) {
    return await cloudinary.uploader.upload(filePath, {
        allowed_formats : ['png', 'webp', 'jpg'],
        folder : 'aspirantes_certificados'  
    })
}

