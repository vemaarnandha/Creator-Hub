import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import auth from "./routes/auth";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: "http://localhost:5173", // URL React teman kamu
}));

// Route auth (tidak butuh token)
app.route("/auth", auth);

// Contoh route yang butuh token
app.get("/dashboard", async (c) => {
  return c.json({ message: "Selamat datang di dashboard!" });
});

export default app;