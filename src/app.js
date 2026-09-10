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
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js";

//routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
        errors: err.errors || [],
    });
});

export {app};