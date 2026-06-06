import express from "express";
import promotionRouter from "./routes/promotion";
import sandboxRouter from "./routes/sandbox";
import executeRouter from "./routes/execute";
import testsRouter from "./routes/tests";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,x-user-id");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use("/api/sandbox", sandboxRouter);
app.use("/api/promotion", promotionRouter);
app.use("/api/execute", executeRouter);
app.use("/api/tests", testsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
