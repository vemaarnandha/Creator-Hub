import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET ?? "secret";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Token tidak ditemukan!" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(token, JWT_SECRET);
    c.set("user", payload); // simpan data user ke context
    await next();
  } catch {
    return c.json({ message: "Token tidak valid atau sudah expired!" }, 401);
  }
});