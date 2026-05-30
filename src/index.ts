import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import creator from "./routes/creator"; // tambah ini
import client from "./routes/client"; //tambah ini
import collaboration from "./routes/collaboration";


const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: "http://localhost:5173",
}));

app.route("/auth", auth);
app.route("/creators", creator);
app.route("/clients", client); // tambah ini

app.route("/collaboration", collaboration);  // atau /projects
export default app;