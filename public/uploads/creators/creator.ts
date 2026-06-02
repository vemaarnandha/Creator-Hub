import { Hono } from "hono";
import { db } from "../../../src/db/index";
import { creators } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../../../src/middleware/authMiddleware";
import { serveStatic } from "hono/bun"; // untuk serve file upload

const creator = new Hono();

creator.use("*", authMiddleware);

// Serve static files (agar foto bisa diakses via URL)
creator.use("/uploads/*", serveStatic({ root: "./public" }));

// GET semua creator
creator.get("/", async (c) => {
  const allCreators = await db.select().from(creators);
  return c.json({ message: "Berhasil mengambil data creator", data: allCreators });
});

// GET satu creator
creator.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db.select().from(creators).where(eq(creators.id, id));
  
  if (result.length === 0) return c.json({ message: "Creator tidak ditemukan!" }, 404);
  
  return c.json({ message: "Berhasil mengambil data creator", data: result[0] });
});

// ===== POST Tambah Creator + Upload Foto =====
creator.post("/", async (c) => {
  const body = await c.req.parseBody(); // penting untuk file upload

  if (!body.name) {
    return c.json({ message: "Nama wajib diisi!" }, 400);
  }

  let photoPath: string | null = null;

  // Handle upload foto
  if (body.photo && typeof body.photo === "object") {
    const file = body.photo as File;
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

    if (!allowedExtensions.includes(fileExtension || "")) {
      return c.json({ message: "Format file tidak didukung! Gunakan jpg, jpeg, png, atau webp." }, 400);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const uploadPath = `./public/uploads/creators/${fileName}`;

    await Bun.write(uploadPath, file);
    photoPath = `/uploads/creators/${fileName}`;
  }

  const newCreator = await db.insert(creators).values({
    name: body.name as string,
    photo: photoPath,
    niche: body.niche as string,
    followers: Number(body.followers) || 0,
    platform: body.platform as any,
    status: (body.status as any) ?? "active",
  }).returning();

  return c.json({
    message: "Creator berhasil ditambahkan!",
    data: newCreator[0],
  }, 201);
});

// ===== PUT Update Creator + Upload Foto Baru =====
creator.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.parseBody();

  const existing = await db.select().from(creators).where(eq(creators.id, id));
  if (existing.length === 0 || !existing[0]) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  const { photo: existingPhoto, name: existingName, niche: existingNiche, followers: existingFollowers, platform: existingPlatform, status: existingStatus } = existing[0];

  let photoPath = existingPhoto;

  // Jika ada foto baru
  if (body.photo && typeof body.photo === "object") {
    const file = body.photo as File;
    const fileName = `${Date.now()}-${file.name}`;
    const uploadPath = `./public/uploads/creators/${fileName}`;

    await Bun.write(uploadPath, file);
    photoPath = `/uploads/creators/${fileName}`;
  }

  const updated = await db
    .update(creators)
    .set({
      name: (body.name as string) ?? existingName,
      photo: photoPath,
      niche: (body.niche as string) ?? existingNiche,
      followers: Number(body.followers) ?? existingFollowers,
      platform: (body.platform as any) ?? existingPlatform,
      status: (body.status as any) ?? existingStatus,
    })
    .where(eq(creators.id, id))
    .returning();

  return c.json({
    message: "Creator berhasil diupdate!",
    data: updated[0],
  });
});

// DELETE creator
creator.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const existing = await db.select().from(creators).where(eq(creators.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  await db.delete(creators).where(eq(creators.id, id));
  return c.json({ message: "Creator berhasil dihapus!" });
});

export default creator;