import { Hono } from "hono";
import { db } from "../db/index";
import { schedules, projects, creators } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const schedule = new Hono();

schedule.use("*", authMiddleware);

// GET semua schedule
schedule.get("/", async (c) => {
  const allSchedules = await db
    .select({
      ...schedules,
      projectTitle: projects.title,
      creatorName: creators.name,
    })
    .from(schedules)
    .leftJoin(projects, eq(schedules.projectId, projects.id))
    .leftJoin(creators, eq(schedules.creatorId, creators.id));

  return c.json({
    message: "Success",
    data: allSchedules,
  });
});

// GET schedule berdasarkan project
schedule.get("/project/:projectId", async (c) => {
  const projectId = Number(c.req.param("projectId"));

  const projectSchedules = await db
    .select()
    .from(schedules)
    .where(eq(schedules.projectId, projectId));

  return c.json({
    message: "Success",
    data: projectSchedules,
  });
});

// POST buat schedule baru
schedule.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.projectId || !body.creatorId || !body.postingDate || !body.platform) {
    return c.json({ message: "Project ID, Creator ID, Tanggal Posting, dan Platform wajib diisi!" }, 400);
  }

  const newSchedule = await db.insert(schedules).values({
    projectId: body.projectId,
    creatorId: body.creatorId,
    postingDate: body.postingDate,
    platform: body.platform,
    contentType: body.contentType,
    caption: body.caption,
    status: body.status ?? "scheduled",
  }).returning();

  return c.json({
    message: "Schedule berhasil dibuat!",
    data: newSchedule[0],
  }, 201);
});

// PUT update schedule
schedule.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const existing = await db.select().from(schedules).where(eq(schedules.id, id));
  if (existing.length === 0) {
    return c.json({ message: "Schedule tidak ditemukan!" }, 404);
  }

  const updated = await db
    .update(schedules)
    .set({
      postingDate: body.postingDate ?? existing[0].postingDate,
      platform: body.platform ?? existing[0].platform,
      contentType: body.contentType ?? existing[0].contentType,
      caption: body.caption ?? existing[0].caption,
      status: body.status ?? existing[0].status,
    })
    .where(eq(schedules.id, id))
    .returning();

  return c.json({
    message: "Schedule berhasil diupdate!",
    data: updated[0],
  });
});

// DELETE schedule
schedule.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db.select().from(schedules).where(eq(schedules.id, id));
  if (existing.length === 0) {
    return c.json({ message: "Schedule tidak ditemukan!" }, 404);
  }

  await db.delete(schedules).where(eq(schedules.id, id));
  return c.json({ message: "Schedule berhasil dihapus!" });
});

export default schedule;