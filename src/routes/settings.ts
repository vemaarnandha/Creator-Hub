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

// PUT Update Profile (DEF-03 FIXED + Error 500 Solved)
settings.put("/profile", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  // === DEF-03 FIX: Cegah privilege escalation ===
  const updateData: any = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.photo !== undefined || body.profile_photo !== undefined) {
    updateData.profile_photo = body.photo ?? body.profile_photo;
  }
  // role sengaja TIDAK diikutkan

  if (Object.keys(updateData).length === 0) {
    return c.json({ message: "Tidak ada data yang diupdate" }, 400);
  }

  const updated = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, user.id))
    .returning();

  if (!updated || updated.length === 0) {
    return c.json({ message: "Gagal mengupdate profile" }, 400);
  }

  return c.json({
    message: "Profile berhasil diupdate",
    data: updated[0],
  });
});

export default settings;