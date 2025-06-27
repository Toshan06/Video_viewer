import express, { json } from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";
const app = express()

app.use(cors({  //Cross Orgin Resource Sharing
    origin: process.env.CORS,
    credentials: true,
}))
app.use(express.json({  //parses to json format
    limit: '16kb'
}))
app.use(express.urlencoded({  //It's essential for handling form submissions in application/x-www-form-urlencoded format.
    extended: true,
    limit: '16kb',
    parameterLimit: 5000
}))
app.use(express.static("public")) //The express.static() is a built-in middleware function in Express.js that allows you to serve static files (like images, HTML, CSS, and JavaScript) directly to the client. It automatically makes all files inside a specified folder accessible via HTTP requests. Here, app.use(express.static('directory_name'));
app.use(cookieParser()) //Cookie-parser middleware is used to parse the cookies that are attached to the request made by the client to the server.

app.get('',()=>{})


export {app}