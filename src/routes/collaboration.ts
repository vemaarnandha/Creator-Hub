import { Hono } from "hono";
import { db } from "../db/index";
import { projects, projectCreators, clients, creators } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const collaboration = new Hono();

// Semua route butuh auth
collaboration.use("*", authMiddleware);

// ==================== PROJECT ====================

// GET semua project
collaboration.get("/projects", async (c) => {
  const allProjects = await db
    .select({
      id: projects.id,
      clientId: projects.clientId,
      title: projects.title,
      description: projects.description,
      startDate: projects.startDate,
      endDate: projects.endDate,
      budget: projects.budget,
      status: projects.status,
      createdAt: projects.createdAt,
      client: clients.name_brand,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id));

  return c.json({ message: "Success", data: allProjects });
});

// POST buat project baru
collaboration.post("/projects", async (c) => {
  const body = await c.req.json();

  // Validasi format tanggal YYYY-MM-DD
  function isValidDate(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  const newProject = await db
    .insert(projects)
    .values({
      clientId: body.clientId,
      title: body.title,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      budget: body.budget,
      status: body.status || "planning",
    })
    .returning();

  // Di route POST /projects
  if (body.startDate && !isValidDate(body.startDate)) {
    return c.json({ message: "Format startDate harus YYYY-MM-DD!" }, 400);
  }
  if (body.endDate && !isValidDate(body.endDate)) {
    return c.json({ message: "Format endDate harus YYYY-MM-DD!" }, 400);
  }

  return c.json({
    message: "Project berhasil dibuat",
    data: newProject[0],
  });
});

// ==================== ASSIGN CREATOR ====================

// Assign creator ke project (support multiple)
collaboration.post("/assign", async (c) => {
  const { projectId, creatorIds } = await c.req.json(); // creatorIds = array

  if (!projectId || !Array.isArray(creatorIds)) {
    return c.json({ message: "projectId dan creatorIds (array) wajib" }, 400);
  }

  const assignments = creatorIds.map((creatorId) => ({
    projectId,
    creatorId,
  }));

  await db.insert(projectCreators).values(assignments);

  return c.json({
    message: "Creator berhasil di-assign ke project",
    data: assignments,
  });
});

// GET creators di suatu project
collaboration.get("/projects/:id/creators", async (c) => {
  const projectId = Number(c.req.param("id"));

  const result = await db
    .select()
    .from(projectCreators)
    .leftJoin(creators, eq(projectCreators.creatorId, creators.id))
    .where(eq(projectCreators.projectId, projectId));

  return c.json({ message: "Success", data: result });
});

// ==================== UPDATE STATUS ====================

collaboration.patch("/projects/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json();

  const updated = await db
    .update(projects)
    .set({ status })
    .where(eq(projects.id, id))
    .returning();

  return c.json({ message: "Status updated", data: updated[0] });
});

export default collaboration;