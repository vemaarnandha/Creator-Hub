import { Hono } from "hono";
import { db } from "../db/index";
import { projects, creators, clients, projectCreators } from "../db/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const dashboard = new Hono();

dashboard.use("*", authMiddleware);

// GET /dashboard - Statistik utama
dashboard.get("/", async (c) => {
  try {
    // Total Creators
    const totalCreators = await db.select({ count: count() }).from(creators);
    
    // Total Clients
    const totalClients = await db.select({ count: count() }).from(clients);
    
    // Total Projects
    const totalProjects = await db.select({ count: count() }).from(projects);
    
    // Projects Aktif (Ongoing)
    const activeProjects = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, "ongoing"));

    // Total Creator yang di-assign ke project
    const assignedCreators = await db
      .select({ count: count() })
      .from(projectCreators);

    // Statistik Project per Status
    const projectsByStatus = await db
      .select({
        status: projects.status,
        total: count(),
      })
      .from(projects)
      .groupBy(projects.status);

    return c.json({
      message: "Dashboard statistics fetched successfully",
      data: {
        totalCreators: totalCreators[0]?.count || 0,
        totalClients: totalClients[0]?.count || 0,
        totalProjects: totalProjects[0]?.count || 0,
        activeProjects: activeProjects[0]?.count || 0,
        assignedCreators: assignedCreators[0]?.count || 0,
        projectsByStatus,
      }
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Gagal mengambil data dashboard" }, 500);
  }
});

// GET /dashboard/recent - Recent projects dengan client info
dashboard.get("/recent", async (c) => {
  try {
    const recentProjects = await db
      .select({
        id: projects.id,
        projectName: projects.title,
        title: projects.title,
        clientName: clients.name_brand,
        name_brand: clients.name_brand,
        status: projects.status,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(projects.createdAt))
      .limit(10);

    return c.json({
      message: "Recent projects fetched",
      data: recentProjects,
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Gagal mengambil data project terbaru" }, 500);
  }
});

export default dashboard;