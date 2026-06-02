import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();


const allowedOrigins = env.frontendUrl
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);
app.use(errorHandler);

export default app;
