import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
    cors({
        origins : process.env.CORS_ORIGIN,
        credentials : true 
    })
)

//common middleware
app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());

//import routes
import healthCheckRouter from "./routes/healthCheck.routes.js";

//routes
app.use("/api/v1/healthcheck", healthCheckRouter);

export {app};