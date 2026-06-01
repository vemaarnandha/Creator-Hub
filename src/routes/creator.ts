import { Hono } from "hono";
import { db } from "../db/index";
import { creators } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const creator = new Hono();

creator.use("*", authMiddleware);

// ===== GET semua creator =====
creator.get("/", async (c) => {
  const allCreators = await db.select().from(creators);
  return c.json({
    message: "Berhasil mengambil data creator",
    data: allCreators,
  });
});

// ===== GET satu creator by ID =====
creator.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.id, id));

  if (result.length === 0) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  return c.json({
    message: "Berhasil mengambil data creator",
    data: result[0],
  });
});

// ===== POST tambah creator baru =====
creator.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.name) {
    return c.json({ message: "Nama wajib diisi!" }, 400);
  }

  // Validasi platform jika ada
  if (body.platform && !["instagram", "tiktok", "youtube", "twitter"].includes(body.platform)) {
    return c.json({ message: "Platform tidak valid!" }, 400);
  }

  const newCreator = await db.insert(creators).values({
    name: body.name,
    photo: body.photo ?? null,
    niche: body.niche,
    followers: body.followers ?? 0,
    platform: body.platform,
    status: body.status ?? "active",
  }).returning();

  return c.json({
    message: "Creator berhasil ditambahkan!",
    data: newCreator[0],
  }, 201);
});

// ===== PUT update creator =====
creator.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const existing = await db
    .select()
    .from(creators)
    .where(eq(creators.id, id));

  if (existing.length === 0 || !existing[0]) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  const { name: existingName, photo: existingPhoto, niche: existingNiche, followers: existingFollowers, platform: existingPlatform, status: existingStatus } = existing[0];

  const updated = await db
    .update(creators)
    .set({
      name: body.name ?? existingName,
      photo: body.photo ?? existingPhoto,
      niche: body.niche ?? existingNiche,
      followers: body.followers ?? existingFollowers,
      platform: body.platform ?? existingPlatform,
      status: body.status ?? existingStatus,
    })
    .where(eq(creators.id, id))
    .returning();

  if (!updated[0]) {
    return c.json({ message: "Gagal mengupdate creator!" }, 500);
  }

  return c.json({
    message: "Creator berhasil diupdate!",
    data: updated[0],
  });
});

// ===== DELETE creator =====
creator.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db
    .select()
    .from(creators)
    .where(eq(creators.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  await db.delete(creators).where(eq(creators.id, id));

  return c.json({ message: "Creator berhasil dihapus!" });
});

export default creator;