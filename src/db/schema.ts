import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

//tabel users (admin)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profile_photo: text("profile_photo"),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

//tabel creators
export const creators = sqliteTable("creators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  photo: text("photo"),
  name: text("name").notNull(),
  niche: text("niche"),
  followers: integer("followers").default(0),
  platform: text("platform", {
    enum: ["instagram", "tiktok", "youtube", "twitter"],
  }).notNull(),
  status: text("status", {
    enum: ["active", "inactive"],
  }).default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// tabel clients
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name_brand: text("name_brand").notNull(),
  industri: text("industri").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  status: text("status", {
    enum: ["active", "inactive"],
  }).default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ==================== COLLABORATION ====================

// Tabel Projects / Campaign
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  budget: integer("budget").default(0),
  status: text("status", {
    enum: ["planning", "ongoing", "completed", "cancelled"],
  }).default("planning"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Pivot Table (Many-to-Many Creator <-> Project)
export const projectCreators = sqliteTable("project_creators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id),
  creatorId: integer("creator_id").references(() => creators.id),
  assignedAt: text("assigned_at").default(sql`CURRENT_TIMESTAMP`),
  // Bisa tambah kolom role/fee dll nanti
});
