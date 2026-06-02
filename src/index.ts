import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import creator from "./routes/creator"; // tambah ini
import client from "./routes/client"; //tambah ini
import collaboration from "./routes/collaboration";
import dashboard from "./routes/dashboard";
import schedule from "./routes/schedule";
import invoice from "./routes/invoice";
import review from "./routes/review";
import notification from "./routes/notification";
import search from "./routes/search";
import settings from "./routes/settings";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000", 
    // Ganti dengan IP address frontend Anda
    // Contoh: "http://192.168.x.x:5173"
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.route("/auth", auth);
app.route("/dashboard", dashboard);
app.route("/creators", creator);
app.route("/clients", client); // tambah ini
app.route("/collaboration", collaboration);  // atau /projects
app.route("/schedule", schedule); // sementara schedule gabung di collaboration dulu, bisa dipisah nanti kalau sudah banyak route nya
app.route("/invoices", invoice); // tambah ini
app.route("/reviews", review); // tambah ini
app.route("/notifications", notification); // tambah ini
app.route("/search", search); // tambah ini
app.route("/settings", settings); // nanti ganti ke settings route yang sebenarnya

export default app;