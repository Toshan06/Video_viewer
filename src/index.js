import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { application } from 'express';

dotenv.config({
    path:"./.env"
})

connectDB()
.then(()=>{
    app.on('err',(err)=>{
        console.log('ERROR: ',err)
        throw err
    })
    app.listen(process.env.PORT || 8000), ()=>{console.log(`Server running at PORT = ${process.env.PORT}`)}
})
.catch((e)=>{
    console.log('DB Connection failed with error ',e)
})














/*
import mongoose from "mongoose";
import {db_name} from './constants'
import express from 'express'
const app = express()

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`)
        app.on("error",()=>{
            console.log(error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on ${process.env.PORT}`)
        })

    } catch (error) {
        console.error('ERROR: ',error)
        throw error
    }
})()
*/