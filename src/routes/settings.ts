import { Hono } from "hono";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";
import bcrypt from "bcryptjs";

const settings = new Hono();

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

// PUT Update Profile
settings.put("/profile", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const updated = await db
    .update(users)
    .set({
      name: body.name ?? undefined,
      profile_photo: body.profile_photo ?? undefined,
    })
    .where(eq(users.id, user.id))
    .returning();

  return c.json({
    message: "Profile berhasil diupdate",
    data: updated[0],
  });
});

// PUT Ganti Password
settings.put("/change-password", async (c) => {
  const user = c.get("user");
  const { oldPassword, newPassword } = await c.req.json();

  const currentUser = await db.select().from(users).where(eq(users.id, user.id));

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