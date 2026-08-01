import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./platform/errors.js";
import { apiV1Router } from "./routes/v1.js";
const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.get("/", (_req, res) => {
    res.json({ message: "AInvoker API" });
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/v1", apiV1Router);
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map