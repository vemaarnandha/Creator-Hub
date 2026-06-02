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
      amount: invoices.amount,
      // ... (list semua columns)
      projectTitle: projects.title,
      clientName: clients.name_brand,
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

export default invoice;
