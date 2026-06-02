import { Hono } from "hono";
import { db } from "../db/index";
import { creators, clients } from "../db/schema";
import { like, or, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";

const search = new Hono();

search.use("*", authMiddleware);

// Search global (creator + client)
search.get("/", async (c) => {
  const query = c.req.query("q") || "";

  if (!query) {
    return c.json({ message: "Query pencarian wajib diisi" }, 400);
  }

  // Search Creators
  const creatorResults = await db
    .select()
    .from(creators)
    .where(
      or(
        like(creators.name, `%${query}%`),
        like(creators.niche, `%${query}%`)
      )
    )
    .limit(10);

  // Search Clients
  const clientResults = await db
    .select()
    .from(clients)
    .where(
      or(
        like(clients.name_brand, `%${query}%`),
        like(clients.industry, `%${query}%`)
      )
    )
    .limit(10);

  return c.json({
    message: "Hasil pencarian",
    data: {
      creators: creatorResults,
      clients: clientResults,
    }
  });
});

export default search;