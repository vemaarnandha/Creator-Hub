import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { Variables } from "../types/hono-env";

const JWT_SECRET = process.env.JWT_SECRET ?? "secret";

export const authMiddleware = createMiddleware <{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Token tidak ditemukan!" }, 401);
  }

  const token = authHeader.split(" ")[1];

  // Guard: pastikan token tidak undefined (diperlukan karena noUncheckedIndexedAccess: true)
  if (!token) {
    return c.json({ message: "Token tidak ditemukan!" }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    const userData = payload as { id: number; email: string; role: string; name: string };
    c.set("user", userData); // simpan data user ke context
    await next();
  } catch {
    return c.json({ message: "Token tidak valid atau sudah expired!" }, 401);
  }
});