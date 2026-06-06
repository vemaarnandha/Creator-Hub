import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { join } from "path";
import { promises as fs } from "fs";
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
import upload from "./routes/upload";

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

// FIX [DEBUG_UPLOADS]: Log all upload requests to debug serving issues
app.use("/uploads/*", async (c, next) => {
  console.log("📡 UPLOADS REQUEST RECEIVED");
  console.log("  URL:", c.req.url);
  console.log("  Path:", c.req.path);
  console.log("  Method:", c.req.method);
  await next();
});

// FIX [STATIC_SERVE]: Use absolute path for serveStatic
// Relative paths might not resolve correctly in all environments
const publicPath = join(process.cwd(), "public");
app.use("/uploads/*", serveStatic({ root: publicPath }));
console.log("📁 Static files serving from:", publicPath);
console.log("📁 Serving /uploads/* requests from: " + join(publicPath, "uploads"));

// FIX [FILE_SERVE_FALLBACK]: Direct file serving endpoint for debugging
// FIX [DIAGNOSTIC_ENDPOINT]: Check uploaded files and system status
app.get("/api/debug/files", async (c) => {
  try {
    const uploadsDir = join(publicPath, "uploads", "profiles");
    const files = await fs.readdir(uploadsDir);
    
    console.log("📊 DIAGNOSTIC: Files in upload directory");
    console.log("  Directory:", uploadsDir);
    console.log("  Files found:", files.length);
    
    // Get details for each file
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = join(uploadsDir, file);
        const stat = await fs.stat(filePath);
        return {
          name: file,
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime,
          isFile: stat.isFile(),
        };
      })
    );
    
    return c.json({
      uploadDir: uploadsDir,
      fileCount: files.length,
      files: fileDetails,
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error("❌ Diagnostic error:", error);
    return c.json({ error: String(error), cwd: process.cwd() }, 500);
  }
});

// FIX [SYSTEM_STATUS_ENDPOINT]: Check system paths
app.get("/api/debug/paths", async (c) => {
  return c.json({
    cwd: process.cwd(),
    publicPath: publicPath,
    uploadsDir: join(publicPath, "uploads"),
    profilesDir: join(publicPath, "uploads", "profiles"),
  });
});

app.get("/api/file/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    const fullPath = join(publicPath, "uploads", "profiles", filename);
    
    console.log("📥 API File request:", filename);
    console.log("📥 Full path:", fullPath);
    
    // Check if file exists
    const file = await fs.readFile(fullPath);
    console.log("✅ File found, size:", file.length);
    
    // Determine MIME type
    let mimeType = "application/octet-stream";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) mimeType = "image/jpeg";
    else if (filename.endsWith(".png")) mimeType = "image/png";
    else if (filename.endsWith(".gif")) mimeType = "image/gif";
    else if (filename.endsWith(".webp")) mimeType = "image/webp";
    
    return new Response(file, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("❌ File serve error:", error);
    return c.json({ error: "File not found: " + String(error) }, 404);
  }
});

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
app.route("/upload", upload); // tambah upload route

export default app;