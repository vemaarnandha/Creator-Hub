import { Hono } from "hono";
import { db } from "../db/index";
import { ratings, creators, projects, clients } from "../db/schema";
import { eq, avg, count } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";
import type { Variables } from "../types/hono-env";

const review = new Hono<{ Variables: Variables }>();

review.use("*", authMiddleware);

// GET semua rating
review.get("/", async (c) => {
  const allRatings = await db
    .select({
      id: ratings.id,
      creatorId: ratings.creatorId,
      projectId: ratings.projectId,
      clientId: ratings.clientId,
      rating: ratings.rating,
      reviewText: ratings.reviewText,
      createdAt: ratings.createdAt,
      creatorName: creators.name,
      projectTitle: projects.title,
      clientName: clients.name_brand,
    })
    .from(ratings)
    .leftJoin(creators, eq(ratings.creatorId, creators.id))
    .leftJoin(projects, eq(ratings.projectId, projects.id))
    .leftJoin(clients, eq(ratings.clientId, clients.id));

  return c.json({
    message: "Success",
    data: allRatings,
  });
});

// GET rating berdasarkan creator
review.get("/creator/:creatorId", async (c) => {
  const creatorId = Number(c.req.param("creatorId"));

  const creatorRatings = await db
    .select({
      id: ratings.id,
      creatorId: ratings.creatorId,
      projectId: ratings.projectId,
      clientId: ratings.clientId,
      rating: ratings.rating,
      reviewText: ratings.reviewText,
      createdAt: ratings.createdAt,
      projectTitle: projects.title,
      clientName: clients.name_brand,
    })
    .from(ratings)
    .leftJoin(projects, eq(ratings.projectId, projects.id))
    .leftJoin(clients, eq(ratings.clientId, clients.id))
    .where(eq(ratings.creatorId, creatorId));

  // Hitung rata-rata rating
  const avgRatingResult = await db
    .select({ average: avg(ratings.rating) })
    .from(ratings)
    .where(eq(ratings.creatorId, creatorId));

  const averageRating = avgRatingResult[0]?.average
    ? parseFloat(Number(avgRatingResult[0].average).toFixed(1))
    : 0;

  return c.json({
    message: "Success",
    data: {
      ratings: creatorRatings,
      averageRating,
      totalRatings: creatorRatings.length,
    },
  });
});

// POST Tambah Rating
review.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.creatorId || !body.rating) {
    return c.json(
      { message: "Creator ID dan Rating (1-5) wajib diisi!" },
      400,
    );
  }

  if (body.rating < 1 || body.rating > 5) {
    return c.json({ message: "Rating harus antara 1 sampai 5!" }, 400);
  }

  const newRating = await db
    .insert(ratings)
    .values({
      projectId: body.projectId || null,
      creatorId: body.creatorId,
      clientId: body.clientId || null,
      rating: body.rating,
      reviewText: body.reviewText,
    })
    .returning();

  return c.json(
    {
      message: "Rating berhasil ditambahkan!",
      data: newRating[0],
    },
    201,
  );
});

// GET Average Rating Creator (untuk dashboard/creator detail)
review.get("/average/:creatorId", async (c) => {
  const creatorId = Number(c.req.param("creatorId"));

  const result = await db
    .select({ average: avg(ratings.rating) })
    .from(ratings)
    .where(eq(ratings.creatorId, creatorId));

  const average = result[0]?.average
    ? parseFloat(Number(result[0].average).toFixed(1))
    : 0;

  return c.json({
    message: "Success",
    averageRating: average,
  });
});

// PUT Update Rating
review.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const existing = await db
    .select()
    .from(ratings)
    .where(eq(ratings.id, id));

  if (existing.length === 0 || !existing[0]) {
    return c.json({ message: "Rating tidak ditemukan!" }, 404);
  }

  if (body.rating && (body.rating < 1 || body.rating > 5)) {
    return c.json({ message: "Rating harus antara 1 sampai 5!" }, 400);
  }

  const updated = await db
    .update(ratings)
    .set({
      rating: body.rating ?? existing[0].rating,
      reviewText: body.reviewText ?? existing[0].reviewText,
    })
    .where(eq(ratings.id, id))
    .returning();

  return c.json({
    message: "Rating berhasil diupdate!",
    data: updated[0],
  });
});

// DELETE Rating
review.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await db
    .select()
    .from(ratings)
    .where(eq(ratings.id, id));

  if (existing.length === 0) {
    return c.json({ message: "Rating tidak ditemukan!" }, 404);
  }

  await db.delete(ratings).where(eq(ratings.id, id));

  return c.json({ message: "Rating berhasil dihapus!" });
});

export default review;