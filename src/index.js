//require('dotenv').config({path:'./env'})
//this line disturb our flow of writting so we use better approach
import { app } from './app.js';
import dotenv from 'dotenv'
dotenv.config({
    path:'./env'
})
//professional approach
import connectDB from "./db/index.js";

connectDB().then(
    ()=>{
        app.listen(process.env.PORT,()=>{
            console.log("Server is running at "+process.env.PORT);
        })
    }
).catch((err)=>{console.log("DB conection error"+err);})







//----this also a process for connecting express and mongoDB 1st approach
// import express from "express";
// const app=express()
// (async()=>{
//     try {
//         await mongoose.connect(process.env.MONGODB_URI.toString+'/'+DB_NAME.toString)
//         app.on("error",(error)=>{
//             console.log("Error :"+error);
//             throw(error)
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log("App is listining on port "+process.env.PORT);
//         })
//     } catch (error) {
//         console.error("ERROR :",error)
//         throw error
//     }
// })()