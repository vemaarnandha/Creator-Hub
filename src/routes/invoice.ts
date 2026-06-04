import { Hono } from "hono";
import { db } from "../db/index";
import { invoices, projects, clients } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const invoice = new Hono();

invoice.use("*", authMiddleware);

// GET semua invoice
invoice.get("/", async (c) => {
  const allInvoices = await db
    .select({
      id: invoices.id,
      projectId: invoices.projectId,
      clientId: invoices.clientId,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      description: invoices.description,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      status: invoices.status,
      createdAt: invoices.createdAt,
      projectTitle: projects.title,
      projectName: projects.title,
      clientName: clients.name_brand,
      name_brand: clients.name_brand,
    })
    .from(invoices)
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id));

  return c.json({
    message: "Success",
    data: allInvoices,
  });
});

// GET invoice berdasarkan project
invoice.get("/project/:projectId", async (c) => {
  const projectId = Number(c.req.param("projectId"));

  const projectInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.projectId, projectId));

  return c.json({
    message: "Success",
    data: projectInvoices,
  });
});

// POST Generate Invoice Baru
invoice.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.projectId || !body.amount) {
    return c.json({ message: "Project ID dan Amount wajib diisi!" }, 400);
  }

  // Generate nomor invoice (contoh: INV-20250602-001)
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${yearMonth}-${randomNum}`;

  const newInvoice = await db
    .insert(invoices)
    .values({
      projectId: body.projectId,
      clientId: body.clientId,
      invoiceNumber,
      amount: body.amount,
      description: body.description,
      issueDate: body.issueDate || new Date().toISOString().split("T")[0],
      dueDate: body.dueDate,
      status: body.status ?? "pending",
    })
    .returning();

  return c.json(
    {
      message: "Invoice berhasil digenerate!",
      data: newInvoice[0],
    },
    201,
  );
});

// PUT Update Status Invoice (misal: paid)
invoice.put("/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json();

  const updated = await db
    .update(invoices)
    .set({ status })
    .where(eq(invoices.id, id))
    .returning();

  if (updated.length === 0) {
    return c.json({ message: "Invoice tidak ditemukan!" }, 404);
  }

  return c.json({
    message: "Status invoice berhasil diupdate!",
    data: updated[0],
  });
});

// GET single invoice by ID
invoice.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const result = await db
    .select({
      id: invoices.id,
      projectId: invoices.projectId,
      clientId: invoices.clientId,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      description: invoices.description,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      status: invoices.status,
      createdAt: invoices.createdAt,
      projectTitle: projects.title,
      projectName: projects.title,
      clientName: clients.name_brand,
      name_brand: clients.name_brand,
    })
    .from(invoices)
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, id));

  if (result.length === 0) {
    return c.json({ message: "Invoice tidak ditemukan!" }, 404);
  }

  return c.json({
    message: "Success",
    data: result[0],
  });
});

// PUT update invoice
invoice.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const existing = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id));

  if (existing.length === 0 || !existing[0]) {
    return c.json({ message: "Invoice tidak ditemukan!" }, 404);
  }

  const updated = await db
    .update(invoices)
    .set({
      projectId: body.projectId ?? existing[0].projectId,
      clientId: body.clientId ?? existing[0].clientId,
      invoiceNumber: body.invoiceNumber ?? existing[0].invoiceNumber,
      amount: body.amount ?? existing[0].amount,
      description: body.description ?? existing[0].description,
      issueDate: body.issueDate ?? existing[0].issueDate,
      dueDate: body.dueDate ?? existing[0].dueDate,
      status: body.status ?? existing[0].status,
    })
    .where(eq(invoices.id, id))
    .returning();

  return c.json({
    message: "Invoice berhasil diupdate!",
    data: updated[0],
  });
});

// DELETE invoice
invoice.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Invoice tidak ditemukan!" }, 404);
  }

  await db.delete(invoices).where(eq(invoices.id, id));

  return c.json({ message: "Invoice berhasil dihapus!" });
});

export default invoice;