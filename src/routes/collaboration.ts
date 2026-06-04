import { Hono } from "hono";
import { db } from "../db/index";
import { projects, projectCreators, clients, creators } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const collaboration = new Hono();

// Semua route butuh auth
collaboration.use("*", authMiddleware);

// Helper function: Get project with creators
async function getProjectWithCreators(projectId: number) {
  const projectData = await db
    .select({
      id: projects.id,
      clientId: projects.clientId,
      projectName: projects.title,
      title: projects.title,
      description: projects.description,
      startDate: projects.startDate,
      endDate: projects.endDate,
      budget: projects.budget,
      status: projects.status,
      createdAt: projects.createdAt,
      clientName: clients.name_brand,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, projectId));

  if (projectData.length === 0) return null;

  const creatorAssignments = await db
    .select({
      creatorId: projectCreators.creatorId,
      creatorName: creators.name,
    })
    .from(projectCreators)
    .leftJoin(creators, eq(projectCreators.creatorId, creators.id))
    .where(eq(projectCreators.projectId, projectId));

  const creatorIds = creatorAssignments.map((c) => c.creatorId).filter((id): id is number => id !== null);
  const creatorNames = creatorAssignments.map((c) => c.creatorName).filter((name): name is string => name !== null);

  return {
    ...projectData[0],
    creatorIds,
    creatorNames,
  };
}

// ==================== PROJECT ====================

// GET semua project dengan creators
collaboration.get("/projects", async (c) => {
  const allProjects = await db
    .select({
      id: projects.id,
      clientId: projects.clientId,
      projectName: projects.title,
      title: projects.title,
      description: projects.description,
      startDate: projects.startDate,
      endDate: projects.endDate,
      budget: projects.budget,
      status: projects.status,
      createdAt: projects.createdAt,
      clientName: clients.name_brand,
      name_brand: clients.name_brand,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id));

  // Fetch creators untuk setiap project
  const projectsWithCreators = await Promise.all(
    allProjects.map(async (project) => {
      const creatorAssignments = await db
        .select({
          creatorId: projectCreators.creatorId,
          creatorName: creators.name,
        })
        .from(projectCreators)
        .leftJoin(creators, eq(projectCreators.creatorId, creators.id))
        .where(eq(projectCreators.projectId, project.id));

      const creatorIds = creatorAssignments.map((c) => c.creatorId).filter((id): id is number => id !== null);
      const creatorNames = creatorAssignments.map((c) => c.creatorName).filter((name): name is string => name !== null);

      return {
        ...project,
        creatorIds,
        creatorNames,
      };
    })
  );

  return c.json({ message: "Success", data: projectsWithCreators });
});

// POST buat project baru + assign creators
collaboration.post("/projects", async (c) => {
  const body = await c.req.json();
  
  // Validasi format tanggal YYYY-MM-DD
  function isValidDate(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  if (body.startDate && !isValidDate(body.startDate)) {
    return c.json({ message: "Format startDate harus YYYY-MM-DD!" }, 400);
  }
  if (body.endDate && !isValidDate(body.endDate)) {
    return c.json({ message: "Format endDate harus YYYY-MM-DD!" }, 400);
  }
  
  const newProject = await db.insert(projects).values({
    clientId: body.clientId,
    title: body.title || body.projectName,
    description: body.description,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: body.budget,
    status: body.status || "planning",
  }).returning();

  // Assign creators jika ada
  if (body.creatorIds && Array.isArray(body.creatorIds) && body.creatorIds.length > 0) {
    const assignments = body.creatorIds.map((creatorId: number) => ({
      projectId: newProject[0]!.id,
      creatorId,
    }));
    await db.insert(projectCreators).values(assignments);
  }

  // Return project with creators
  const projectWithCreators = await getProjectWithCreators(newProject[0]!.id);

  return c.json({ 
    message: "Project berhasil dibuat", 
    data: projectWithCreators 
  });
});

// GET satu project by ID dengan creators
collaboration.get("/projects/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const projectWithCreators = await getProjectWithCreators(id);

  if (!projectWithCreators) {
    return c.json({ message: "Project tidak ditemukan!" }, 404);
  }

  return c.json({ message: "Success", data: projectWithCreators });
});

// PUT update project + creators
collaboration.put("/projects/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));

  if (existing.length === 0 || !existing[0]) {
    return c.json({ message: "Project tidak ditemukan!" }, 404);
  }

  const updated = await db
    .update(projects)
    .set({
      title: body.title ?? body.projectName ?? existing[0].title,
      description: body.description ?? existing[0].description,
      startDate: body.startDate ?? existing[0].startDate,
      endDate: body.endDate ?? existing[0].endDate,
      budget: body.budget ?? existing[0].budget,
      status: body.status ?? existing[0].status,
      clientId: body.clientId ?? existing[0].clientId,
    })
    .where(eq(projects.id, id))
    .returning();

  // Update creator assignments jika ada creatorIds
  if (body.creatorIds && Array.isArray(body.creatorIds)) {
    // Delete existing assignments
    await db.delete(projectCreators).where(eq(projectCreators.projectId, id));
    
    // Insert new assignments
    if (body.creatorIds.length > 0) {
      const assignments = body.creatorIds.map((creatorId: number) => ({
        projectId: id,
        creatorId,
      }));
      await db.insert(projectCreators).values(assignments);
    }
  }

  // Return updated project with creators
  const projectWithCreators = await getProjectWithCreators(id);

  return c.json({
    message: "Project berhasil diupdate!",
    data: projectWithCreators,
  });
});

// DELETE project + creators
collaboration.delete("/projects/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Project tidak ditemukan!" }, 404);
  }

  // Delete creator assignments first (cascade)
  await db.delete(projectCreators).where(eq(projectCreators.projectId, id));

  // Delete project
  await db.delete(projects).where(eq(projects.id, id));

  return c.json({ message: "Project berhasil dihapus!" });
});

// ==================== ASSIGN CREATOR ====================

// Assign creator ke project (support multiple)
collaboration.post("/assign", async (c) => {
  const { projectId, creatorIds } = await c.req.json(); // creatorIds = array

  if (!projectId || !Array.isArray(creatorIds)) {
    return c.json({ message: "projectId dan creatorIds (array) wajib" }, 400);
  }

  const assignments = creatorIds.map(creatorId => ({
    projectId,
    creatorId,
  }));

  await db.insert(projectCreators).values(assignments);

  return c.json({ 
    message: "Creator berhasil di-assign ke project",
    data: assignments 
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