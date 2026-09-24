import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/index.js";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/index.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));

// Mount routes
app.use("/api", routes);

// Direct health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 & error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
