import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config(
    {
        path : "./.env"
    }
);

const PORT = process.env.PORT || 7070

connectDB()
    .then(()=>{
        app.listen(PORT,()=>{
        console.log(`server is running on http://localhost:${process.env.PORT}`);
        })
    })
    .catch((err)=>{
        console.log("mongoDB connection error", err)
    })
