import { CorsOptions } from 'cors'

export const corsConfig : CorsOptions = {
    origin : function(origin, callback){
        const whiteList = [process.env.FRONTEND_URL]
        if(whiteList.includes(origin) || !origin){
            callback(null, true)
        }else{
            callback(new Error('CORS Error'))
        }
    }
}