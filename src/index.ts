import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import creator from "./routes/creator"; // tambah ini

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: "http://localhost:5173",
}));

app.route("/auth", auth);
app.route("/creators", creator); // tambah ini

export default app;