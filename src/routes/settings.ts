import { Hono } from "hono";
import type { Variables } from "../types/hono-env";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";
import bcrypt from "bcryptjs";

const settings = new Hono<{ Variables: Variables }>();

settings.use("*", authMiddleware);

// GET profile admin saat ini
settings.get("/profile", async (c) => {
  const user = c.get("user");

  const profile = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      profile_photo: users.profile_photo,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, user.id));

  return c.json({
    message: "Success",
    data: profile[0],
  });
});

// PUT Update Profile (DEF-03 FIXED)
settings.put("/profile", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  // === DEF-03 FIX: Cegah privilege escalation ===
  // Hapus field role dari update agar user tidak bisa ubah role sendiri
  const { role, ...safeBody } = body;

  const updated = await db
    .update(users)
    .set({
      name: safeBody.name ?? undefined,
      email: safeBody.email ?? undefined,
      profile_photo: safeBody.photo ?? safeBody.profile_photo ?? undefined,
      // role TIDAK boleh diubah melalui endpoint ini
    })
    .where(eq(users.id, user.id))
    .returning();

  if (!updated[0]) {
    return c.json({ message: "Gagal mengupdate profile" }, 400);
  }

  return c.json({
    message: "Profile berhasil diupdate",
    data: updated[0],
  });
});

// PUT Ganti Password
settings.put("/change-password", async (c) => {
  const user = c.get("user");
  const { oldPassword, newPassword } = await c.req.json();

  if (!oldPassword || !newPassword) {
    return c.json({ message: "Password lama dan baru wajib diisi!" }, 400);
  }

  const currentUser = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id));

  if (!currentUser[0]) {
    return c.json({ message: "User tidak ditemukan!" }, 404);
  }

  const isValid = await bcrypt.compare(oldPassword, currentUser[0].password);
  if (!isValid) {
    return c.json({ message: "Password lama salah!" }, 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user.id));

  return c.json({ message: "Password berhasil diubah" });
});

export default settings;