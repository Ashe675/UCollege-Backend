import server from './server'
import colors from 'colors'

const port = process.env.PORT || 4000

server.listen(port, ()=>{
    console.log(colors.cyan.bold(`REST API on port ${port}`))
})

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
