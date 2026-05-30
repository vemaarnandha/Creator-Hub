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
