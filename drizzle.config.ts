import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",  // lokasi file schema
  out: "./drizzle",              // folder output migration
  dialect: "sqlite",             // jenis database
  dbCredentials: {
    url: "file:creatorhub.db",   // nama file database SQLite
  },
});