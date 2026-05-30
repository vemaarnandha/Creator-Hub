import { Hono } from "hono";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const auth = new Hono();

const JWT_SECRET = process.env.JWT_SECRET ?? "secret";

// ===== REGISTER =====
auth.post("/register", async (c) => {
  const body = await c.req.json();

  // Validasi input
  if (!body.name || !body.email || !body.password) {
    return c.json({ message: "Nama, email, dan password wajib diisi!" }, 400);
  }

  // Cek email sudah terdaftar atau belum
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email));

  if (existing.length > 0) {
    return c.json({ message: "Email sudah terdaftar!" }, 409);
  }

  // Enkripsi password
  const hashedPassword = await bcrypt.hash(body.password, 10);

  // Simpan ke database
  const newUser = await db.insert(users).values({
    name: body.name,
    email: body.email,
    password: hashedPassword,
  }).returning();

  return c.json({
    message: "Registrasi berhasil!",
    user: {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
    },
  }, 201);
});

// ===== LOGIN =====
auth.post("/login", async (c) => {
  const body = await c.req.json();

  // Validasi input
  if (!body.email || !body.password) {
    return c.json({ message: "Email dan password wajib diisi!" }, 400);
  }

  // Cari user berdasarkan email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email));

  if (user.length === 0) {
    return c.json({ message: "Email atau password salah!" }, 401);
  }

  // Cek password
  const isPasswordValid = await bcrypt.compare(body.password, user[0].password);

  if (!isPasswordValid) {
    return c.json({ message: "Email atau password salah!" }, 401);
  }

  // Buat JWT token
  const token = await sign(
    {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expired 24 jam
    },
    JWT_SECRET
  );

  return c.json({
    message: "Login berhasil!",
    token,
    user: {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      role: user[0].role,
    },
  });
});

export default auth;