import { Hono } from "hono";
import { db } from "../db/index";
import { creators } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const creator = new Hono();

// Semua route creator butuh login
creator.use("*", authMiddleware);

// ===== GET semua creator =====
// Fungsi: ambil seluruh data creator dari database
creator.get("/", async (c) => {
  const allCreators = await db.select().from(creators);
  return c.json({
    message: "Berhasil mengambil data creator",
    data: allCreators,
  });
});

// ===== GET satu creator by ID =====
// Fungsi: ambil detail satu creator berdasarkan id di URL
creator.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const creator = await db
    .select()
    .from(creators)
    .where(eq(creators.id, id));

  if (creator.length === 0) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  return c.json({
    message: "Berhasil mengambil data creator",
    data: creator[0],
  });
});

// ===== POST tambah creator baru =====
// Fungsi: terima data dari frontend, simpan ke database
creator.post("/", async (c) => {
  const body = await c.req.json();

  // Validasi field wajib
  if (!body.name || !body.email) {
    return c.json({ message: "Nama dan email wajib diisi!" }, 400);
  }

  // Cek email sudah dipakai atau belum
  const existing = await db
    .select()
    .from(creators)
    .where(eq(creators.email, body.email));

  if (existing.length > 0) {
    return c.json({ message: "Email creator sudah terdaftar!" }, 409);
  }

  const newCreator = await db.insert(creators).values({
    name: body.name,
    email: body.email,
    phone: body.phone ?? null,
    bio: body.bio ?? null,
    instagram: body.instagram ?? null,
    tiktok: body.tiktok ?? null,
    youtube: body.youtube ?? null,
    followers: body.followers ?? 0,
    status: body.status ?? "active",
  }).returning();

  return c.json({
    message: "Creator berhasil ditambahkan!",
    data: newCreator[0],
  }, 201);
});

// ===== PUT update creator =====
// Fungsi: update data creator berdasarkan id
creator.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  // Cek creator ada atau tidak
  const existing = await db
    .select()
    .from(creators)
    .where(eq(creators.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Creator tidak ditemukan!" }, 404);
  }

  const updated = await db
    .update(creators)
    .set({
      name: body.name ?? existing[0].name,
      email: body.email ?? existing[0].email,
      phone: body.phone ?? existing[0].phone,
      bio: body.bio ?? existing[0].bio,
      instagram: body.instagram ?? existing[0].instagram,
      tiktok: body.tiktok ?? existing[0].tiktok,
      youtube: body.youtube ?? existing[0].youtube,
      followers: body.followers ?? existing[0].followers,
      status: body.status ?? existing[0].status,
    })
    .where(eq(creators.id, id))
    .returning();

  return c.json({
    message: "Creator berhasil diupdate!",
    data: updated[0],
  });
});

// ===== DELETE hapus creator =====
// Fungsi: hapus creator berdasarkan id
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