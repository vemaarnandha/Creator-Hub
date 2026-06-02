import { Hono } from "hono";
import { db } from "../db/index";
import { notifications, users } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";
import type { Variables } from "../types/hono-env";

const notification = new Hono<{ Variables: Variables }>();

notification.use("*", authMiddleware);

// GET notifikasi user saat ini
notification.get("/", async (c) => {
  const user = c.get("user"); // dari auth middleware

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));

  return c.json({
    message: "Success",
    data: userNotifications,
  });
});

// POST buat notifikasi baru (bisa dipakai oleh sistem)
notification.post("/", async (c) => {
  const body = await c.req.json();

  const newNotif = await db.insert(notifications).values({
    userId: body.userId,
    title: body.title,
    message: body.message,
    type: body.type ?? "system",
  }).returning();

  return c.json({
    message: "Notifikasi berhasil dibuat",
    data: newNotif[0],
  }, 201);
});

// PUT mark as read
notification.put("/:id/read", async (c) => {
  const id = Number(c.req.param("id"));

  const updated = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();

  return c.json({ message: "Notifikasi ditandai sudah dibaca", data: updated[0] });
});

export default notification;