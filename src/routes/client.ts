import { Hono } from "hono";
import { db } from "../db/index";
import { clients } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const client = new Hono();

// Semua route creator butuh login
client.use("*", authMiddleware);

// ===== GET semua creator =====
// Fungsi: ambil seluruh data creator dari database
client.get("/", async (c) => {
  const allClients = await db.select().from(clients);
  return c.json({
    message: "Berhasil mengambil data client",
    data: allClients,
  });
});

// ===== GET satu creator by ID =====
// Fungsi: ambil detail satu creator berdasarkan id di URL
client.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id));

  if (client.length === 0) {
    return c.json({ message: "Client tidak ditemukan!" }, 404);
  }

  return c.json({
    message: "Berhasil mengambil data client",
    data: client[0],
  });
});

// ===== POST tambah client baru =====
// Fungsi: terima data dari frontend, simpan ke database
client.post("/", async (c) => {
  const body = await c.req.json();

  // Validasi field wajib
  if (!body.name_brand || !body.email) {
    return c.json({ message: "Nama brand dan email wajib diisi!" }, 400);
  }

  // Cek email sudah dipakai atau belum
  const existing = await db
    .select()
    .from(clients)
    .where(eq(clients.email, body.email));

  if (existing.length > 0) {
    return c.json({ message: "Email client sudah terdaftar!" }, 409);
  }

  const newClient = await db.insert(clients).values({
    name_brand: body.name_brand,
    industri: body.industri ?? "belum diisi",
    email: body.email ,
    phone: body.phone ?? "belum diisi",
    status: body.status ?? "active",
  }).returning();

  return c.json({
    message: "Client berhasil ditambahkan!",
    data: newClient[0],
  }, 201);
});

// ===== PUT update client =====
// Fungsi: update data client berdasarkan id
client.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  // Cek client ada atau tidak
  const existing = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Client tidak ditemukan!" }, 404);
  }

  const updated = await db
    .update(clients)
    .set({
      name_brand: body.name_brand ?? existing[0].name_brand,
      industri: body.industri ?? existing[0].industri,
      email: body.email ?? existing[0].email,
      phone: body.phone ?? existing[0].phone,
      industri: body.industri ?? existing[0].industri,
      status: body.status ?? existing[0].status,
    })
    .where(eq(clients.id, id))
    .returning();

  return c.json({
    message: "Client berhasil diupdate!",
    data: updated[0],
  });
});

// ===== DELETE hapus client =====
// Fungsi: hapus client berdasarkan id
client.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Client tidak ditemukan!" }, 404);
  }

  await db.delete(clients).where(eq(clients.id, id));

  return c.json({ message: "Client berhasil dihapus!" });
});

export default client;