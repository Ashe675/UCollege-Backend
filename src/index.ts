import server from './server'
import colors from 'colors'

import express from 'express';


const app = express();

const port = process.env.PORT || 4000

server.listen(port, ()=>{
    console.log(colors.cyan.bold(`REST API on port ${port}`))
})
