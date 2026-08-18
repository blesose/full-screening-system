 import dotenv from "dotenv";

dotenv.config();

const { default: express } = await import("express");
const { default: cors } = await import("cors");
const { default: aiRoutes } = await import("./routes/ai.routes");

const app = express();

const PORT = Number(process.env.API_SERVER_PORT) || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "AI screening server is running.",
  });
});

app.use("/api/ai", aiRoutes);

app.listen(PORT, () => {
  console.log(`AI server running on http://localhost:${PORT}`);
  });