import { Hono } from "hono";
import { db } from "../db/index";
import { notifications, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const notification = new Hono();

notification.use("*", authMiddleware);

// GET notifikasi user saat ini
notification.get("/", async (c) => {
  const user = c.get("user"); // dari auth middleware

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(notifications.createdAt, "desc");

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
    type: body.type ?? "