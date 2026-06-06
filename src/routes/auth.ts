import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
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
  const newUser = await db
    .insert(users)
    .values({
      name: body.name,
      email: body.email,
      password: hashedPassword,
    })
    .returning();

  if (!newUser[0]) {
    return c.json({ message: "Gagal membuat user!" }, 500);
  }

  const { id, name, email } = newUser[0];

  return c.json(
    {
      message: "Registrasi berhasil!",
      user: {
        id,
        name,
        email,
      },
    },
    201,
  );
});

// ===== LOGIN =====
auth.post("/login", async (c) => {
  const body = await c.req.json();

  // Validasi input
  if (!body.email || !body.password) {
    return c.json({ message: "Email dan password wajib diisi!" }, 400);
  }

  // Cari user berdasarkan email
  const user = await db.select().from(users).where(eq(users.email, body.email));

  if (user.length === 0 || !user[0]) {
    return c.json({ message: "Email atau password salah!" }, 401);
  }

  // Cek password
  const isPasswordValid = await bcrypt.compare(body.password, user[0].password);

  if (!isPasswordValid) {
    return c.json({ message: "Email atau password salah!" }, 401);
  }

  const { id, email, role, name } = user[0];

  // Buat JWT token
  const token = await sign(
    {
      id,
      email,
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expired 24 jam
    },
    JWT_SECRET,
  );

  return c.json({
    message: "Login berhasil!",
    token,
    user: {
      id,
      name,
      email,
      role,
    },
  });
});

// ===== GET CURRENT USER =====
auth.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Token tidak ditemukan!" }, 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return c.json({ message: "Token tidak ditemukan!" }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    const userData = payload as { id: number; email: string; role: string };

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profile_photo: users.profile_photo,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userData.id));

    if (user.length === 0) {
      return c.json({ message: "User tidak ditemukan!" }, 404);
    }

    return c.json({
      message: "Success",
      user: user[0],
    });
  } catch {
    return c.json({ message: "Token tidak valid atau sudah expired!" }, 401);
  }
});

// ===== LOGOUT =====
auth.post("/logout", async (c) => {
  // Logout di frontend adalah dengan menghapus token dari localStorage
  // Backend hanya memberikan response sukses
  return c.json({
    message: "Logout berhasil!",
  });
});

export default auth;
