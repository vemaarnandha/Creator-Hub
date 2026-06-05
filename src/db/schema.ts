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
  industry: text("industry").notNull(),
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

// ==================== SCHEDULE ====================

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").references(() => creators.id, { onDelete: "cascade" }),
  postingDate: text("posting_date").notNull(),     // Format: YYYY-MM-DD
  platform: text("platform", {
    enum: ["instagram", "tiktok", "youtube", "twitter"],
  }).notNull(),
  contentType: text("content_type"),               // Reel, Story, Video, Photo, dll
  caption: text("caption"),
  status: text("status", {
    enum: ["scheduled", "posted", "cancelled"],
  }).default("scheduled"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ==================== INVOICE ====================

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  clientId: integer("client_id").references(() => clients.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: integer("amount").notNull(),           // dalam Rupiah
  description: text("description"),
  issueDate: text("issue_date").notNull(),       // YYYY-MM-DD
  dueDate: text("due_date"),
  status: text("status", {
    enum: ["pending", "paid", "overdue", "cancelled"],
  }).default("pending"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ==================== REVIEW & RATING ====================

export const ratings = sqliteTable("ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").references(() => creators.id, { onDelete: "cascade" }),
  clientId: integer("client_id").references(() => clients.id),
  rating: integer("rating").notNull(),           // 1 sampai 5
  reviewText: text("review_text"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ==================== NOTIFICATION ====================

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["deadline", "campaign", "system"] }).default("system"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ==================== FILE UPLOADS / MEDIA ====================

export const fileUploads = sqliteTable("file_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),                    // Nama file asli
  fileSize: integer("file_size").notNull(),                 // Ukuran dalam bytes
  mimeType: text("mime_type").notNull(),                    // Tipe file (image/jpeg, dll)
  filePath: text("file_path").notNull().unique(),           // Path penyimpanan (/uploads/xxx.jpg)
  relatedType: text("related_type", {                       // Tipe entitas yang menggunakan file
    enum: ["profile", "creator", "project", "portfolio"],
  }),
  relatedId: integer("related_id"),                         // ID dari entitas tersebut
  uploadedAt: text("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
});