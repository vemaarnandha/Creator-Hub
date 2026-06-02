import { Hono } from "hono";
import { db } from "../db/index";
import { creators } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";
import { serveStatic } from "hono/bun";

const creator = new Hono();

// ✅ Serve static files untuk foto
creator.use("/uploads/*", serveStatic({ root: "./public" }));

creator.use("*", authMiddleware);

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

// POST Tambah Creator + Upload Foto
creator.post("/", async (c) => {
  const body = await c.req.parseBody();

  if (!body.name) {
    return c.json({ message: "Nama wajib diisi!" }, 400);
  }

  let photoPath: string | null = null;

  if (body.photo && typeof body.photo === "object") {
    const file = body.photo as File;
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp"];

    if (!allowed.includes(fileExtension || "")) {
      return c.json({ message: "Format file tidak didukung!" }, 400);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const uploadPath = `./public/uploads/creators/${fileName}`;

    await Bun.write(uploadPath, file);
    photoPath = `/uploads/creators/${fileName}`;   // Path relatif
  }

  const newCreator = await db.insert(creators).values({
    name: body.name as string,
    photo: photoPath,
    niche: body.niche as string || null,
    followers: Number(body.followers) || 0,
    platform: body.platform as any,
    status: (body.status as any) ?? "active",
  }).returning();

  return c.json({ message: "Creator berhasil ditambahkan!", data: newCreator[0] }, 201);
});

// PUT Update (termasuk foto)
creator.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.parseBody();

  const existing = await db.select().from(creators).where(eq(creators.id, id));
  if (existing.length === 0) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  let photoPath = existing[0]!.photo;

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
      name: (body.name as string) ?? existing[0]!.name,
      photo: photoPath,
      niche: (body.niche as string) ?? existing[0]!.niche,
      followers: Number(body.followers) ?? existing[0]!.followers,
      platform: (body.platform as any) ?? existing[0]!.platform,
      status: (body.status as any) ?? existing[0]!.status,
    })
    .where(eq(creators.id, id))
    .returning();

  return c.json({ message: "Creator berhasil diupdate!", data: updated[0] });
});

creator.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const existing = await db.select().from(creators).where(eq(creators.id, id));
  if (existing.length === 0) return c.json({ message: "Creator tidak ditemukan!" }, 404);

  await db.delete(creators).where(eq(creators.id, id));
  return c.json({ message: "Creator berhasil dihapus!" });
});

export default creator;