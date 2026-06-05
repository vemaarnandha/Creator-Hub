import { Hono } from "hono";
import { db } from "../db/index";
import { fileUploads } from "../db/schema";
import { authMiddleware } from "../middleware/authMiddleware";
import { processUpload, deleteFile } from "../utils/fileHandler";
import { eq } from "drizzle-orm";

const upload = new Hono();

// Middleware: Auth check
upload.use("*", authMiddleware);

/**
 * POST /upload
 * Upload foto dengan validasi dan simpan ke database
 * 
 * Body: FormData
 * - file: File (required)
 * - relatedType: 'profile' | 'creator' | 'project' | 'portfolio' (optional)
 * - relatedId: number (optional)
 */
upload.post("/", async (c) => {
  try {
    // Get user dari auth middleware
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User tidak ditemukan dalam context" }, 401);
    }
    const userId = user.id;

    // Parse FormData
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const relatedType = (formData.get("relatedType") as string) || null;
    const relatedId = formData.get("relatedId") ? Number(formData.get("relatedId")) : null;

    // Validasi file ada
    if (!file) {
      return c.json({ error: "File tidak ditemukan" }, 400);
    }

    // Convert File to Buffer
    const buffer = await file.arrayBuffer();
    const bufferData = Buffer.from(buffer);

    // Process upload
    const uploadResult = await processUpload(
      bufferData,
      file.type,
      file.name
    );

    if (!uploadResult.success) {
      return c.json({ error: uploadResult.error }, 400);
    }

    // Simpan metadata ke database
    const fileRecord = await db.insert(fileUploads).values({
      userId: userId,
      fileName: uploadResult.fileName!,
      fileSize: uploadResult.fileSize!,
      mimeType: uploadResult.mimeType!,
      filePath: uploadResult.filePath!,
      relatedType: relatedType as "profile" | "creator" | "project" | "portfolio" | null,
      relatedId: relatedId,
    }).returning();

    return c.json({
      message: "Upload berhasil",
      data: {
        id: fileRecord[0].id,
        fileName: fileRecord[0].fileName,
        filePath: fileRecord[0].filePath,
        fileSize: fileRecord[0].fileSize,
        mimeType: fileRecord[0].mimeType,
        uploadedAt: fileRecord[0].uploadedAt,
      },
    }, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Terjadi kesalahan saat upload" }, 500);
  }
});

/**
 * GET /upload/user/:userId
 * Dapatkan semua file yang di-upload oleh user tertentu
 */
upload.get("/user/:userId", async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User tidak ditemukan dalam context" }, 401);
    }
    const requestedUserId = Number(c.req.param("userId"));

    // Security: User hanya bisa melihat file mereka sendiri, kecuali admin
    if (user.id !== requestedUserId && user.role !== "admin") {
      return c.json({ error: "Anda tidak berhak mengakses file user lain" }, 403);
    }

    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, requestedUserId));

    return c.json({
      message: "Data file berhasil diambil",
      data: files,
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return c.json({ error: "Terjadi kesalahan" }, 500);
  }
});

/**
 * GET /upload/:id
 * Dapatkan metadata file berdasarkan ID
 */
upload.get("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    const file = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, id));

    if (file.length === 0) {
      return c.json({ error: "File tidak ditemukan" }, 404);
    }

    return c.json({
      message: "Data file berhasil diambil",
      data: file[0],
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return c.json({ error: "Terjadi kesalahan" }, 500);
  }
});

/**
 * DELETE /upload/:id
 * Hapus file dan metadata dari database
 */
upload.delete("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User tidak ditemukan dalam context" }, 401);
    }
    const userId = user.id;

    // Cek file ada dan milik user
    const file = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, id));

    if (file.length === 0) {
      return c.json({ error: "File tidak ditemukan" }, 404);
    }

    if (file[0].userId !== userId) {
      return c.json({ error: "Anda tidak berhak menghapus file ini" }, 403);
    }

    // Hapus file dari disk
    await deleteFile(file[0].fileName);

    // Hapus dari database
    await db.delete(fileUploads).where(eq(fileUploads.id, id));

    return c.json({ message: "File berhasil dihapus" });
  } catch (error) {
    console.error("Delete error:", error);
    return c.json({ error: "Terjadi kesalahan saat menghapus" }, 500);
  }
});

export default upload;