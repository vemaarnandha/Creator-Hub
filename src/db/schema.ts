import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

//tabel users (admin)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

//tabel creators
export const creators = sqliteTable("creators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  bio: text("bio"),
  photoUrl: text("photo_url"),         // URL foto creator
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  youtube: text("youtube"),
  followers: integer("followers").default(0),
  status: text("status").default("active"), // active / inactive
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
