import { Image } from "@prisma/client";
import { prisma } from "../../config/db";

export type ImageData = Pick<Image, 'avatar' | 'publicId' | 'url' | 'userId'>

export async function createImage({ url, avatar, publicId, userId } : ImageData ) {
    
    const image = await prisma.image.create({
        data :{
            url,
            avatar,
            publicId,
            userId
        }
    })

    if(!image){
        throw new Error(`Error al crear la imagen`)
    }

}