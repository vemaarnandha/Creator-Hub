import { Hono } from "hono";
import { db } from "../db/index";
import { schedules, projects, creators } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";
import type { Variables } from "../types/hono-env";

const schedule = new Hono<{ Variables: Variables }>();

schedule.use("*", authMiddleware);

// GET semua schedule
schedule.get("/", async (c) => {
  const allSchedules = await db
    .select({
      id: schedules.id,
      projectId: schedules.projectId,
      creatorId: schedules.creatorId,
      postingDate: schedules.postingDate,
      date: schedules.postingDate,
      platform: schedules.platform,
      contentType: schedules.contentType,
      caption: schedules.caption,
      status: schedules.status,
      createdAt: schedules.createdAt,
      projectTitle: projects.title,
      title: projects.title,
      creatorName: creators.name,
      creator: creators.name,
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
    .select({
      id: schedules.id,
      projectId: schedules.projectId,
      creatorId: schedules.creatorId,
      postingDate: schedules.postingDate,
      date: schedules.postingDate,
      platform: schedules.platform,
      contentType: schedules.contentType,
      caption: schedules.caption,
      status: schedules.status,
      createdAt: schedules.createdAt,
      projectTitle: projects.title,
      title: projects.title,
      creatorName: creators.name,
      creator: creators.name,
    })
    .from(schedules)
    .leftJoin(projects, eq(schedules.projectId, projects.id))
    .leftJoin(creators, eq(schedules.creatorId, creators.id))
    .where(eq(schedules.projectId, projectId));

  return c.json({
    message: "Success",
    data: projectSchedules,
  });
});

// GET single schedule by ID
schedule.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const result = await db
    .select({
      id: schedules.id,
      projectId: schedules.projectId,
      creatorId: schedules.creatorId,
      postingDate: schedules.postingDate,
      date: schedules.postingDate,
      platform: schedules.platform,
      contentType: schedules.contentType,
      caption: schedules.caption,
      status: schedules.status,
      createdAt: schedules.createdAt,
      projectTitle: projects.title,
      title: projects.title,
      creatorName: creators.name,
      creator: creators.name,
    })
    .from(schedules)
    .leftJoin(projects, eq(schedules.projectId, projects.id))
    .leftJoin(creators, eq(schedules.creatorId, creators.id))
    .where(eq(schedules.id, id));

  if (result.length === 0) {
    return c.json({ message: "Schedule tidak ditemukan!" }, 404);
  }

  return c.json({
    message: "Success",
    data: result[0],
  });
});

// POST buat schedule baru
schedule.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.projectId || !body.creatorId || !body.postingDate && !body.date || !body.platform) {
    return c.json({ message: "Project ID, Creator ID, Tanggal Posting, dan Platform wajib diisi!" }, 400);
  }

  const newSchedule = await db.insert(schedules).values({
    projectId: body.projectId,
    creatorId: body.creatorId,
    postingDate: body.postingDate || body.date,
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

  const existing = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, id));

  if (existing.length === 0 || !existing[0]) {  
    return c.json({ message: "Schedule tidak ditemukan!" }, 404);
  }

  const { 
    postingDate: existingPostingDate, 
    platform: existingPlatform, 
    contentType: existingContentType, 
    caption: existingCaption, 
    status: existingStatus 
  } = existing[0];

  const updated = await db
    .update(schedules)
    .set({
      postingDate: body.postingDate ?? body.date ?? existingPostingDate,
      platform: body.platform ?? existingPlatform,
      contentType: body.contentType ?? existingContentType,
      caption: body.caption ?? existingCaption,
      status: body.status ?? existingStatus,
    })
    .where(eq(schedules.id, id))
    .returning();

  if (!updated[0]) {
    return c.json({ message: "Gagal mengupdate schedule!" }, 500);
  }

  // Return with both field name variations
  const result = updated[0];
  return c.json({
    message: "Schedule berhasil diupdate!",
    data: {
      ...result,
      date: result.postingDate,
      title: existing[0]?.caption || '',
    },
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