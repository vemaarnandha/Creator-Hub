import { Hono } from "hono";
import { db } from "../db/index";
import { fileUploads } from "../db/schema";
import { authMiddleware } from "../middleware/authMiddleware";
import { processUpload, deleteFile } from "../utils/fileHandler";
import { eq } from "drizzle-orm";

// ✅ FIX 1: Definisikan tipe Variables agar c.get("user") dikenali
type Variables = {
  user: {
    id: number;
    role: string;
    email: string;
    name: string;
  };
};

const upload = new Hono<{ Variables: Variables }>();

upload.use("*", authMiddleware);

// POST /upload
upload.post("/", async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User tidak ditemukan dalam context" }, 401);
    }
    const userId = user.id;

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const relatedType = (formData.get("relatedType") as string) || null;
    const relatedId = formData.get("relatedId") ? Number(formData.get("relatedId")) : null;

    if (!file) {
      return c.json({ error: "File tidak ditemukan" }, 400);
    }

    const buffer = await file.arrayBuffer();
    const bufferData = Buffer.from(buffer);

    const uploadResult = await processUpload(bufferData, file.type, file.name);

    if (!uploadResult.success) {
      return c.json({ error: uploadResult.error }, 400);
    }

    // ✅ FIX 2: Guard setelah success check, TS sudah tahu tidak undefined
    // Tapi kalau masih error, gunakan non-null assertion atau optional chaining:
    const fileRecord = await db.insert(fileUploads).values({
      userId,
      fileName: uploadResult.fileName ?? "",
      fileSize: uploadResult.fileSize ?? 0,
      mimeType: uploadResult.mimeType ?? "",
      filePath: uploadResult.filePath ?? "",
      relatedType: relatedType as "profile" | "creator" | "project" | "portfolio" | null,
      relatedId,
    }).returning();

    // ✅ FIX 3: Guard fileRecord[0]
    const record = fileRecord[0];
    if (!record) {
      return c.json({ error: "Gagal menyimpan data file" }, 500);
    }

    return c.json({
      message: "Upload berhasil",
      data: {
        id: record.id,
        fileName: record.fileName,
        filePath: record.filePath,
        fileSize: record.fileSize,
        mimeType: record.mimeType,
        uploadedAt: record.uploadedAt,
      },
    }, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Terjadi kesalahan saat upload" }, 500);
  }
});

// GET /upload/user/:userId
upload.get("/user/:userId", async (c) => {
  try {
    const user = c.get("user"); // ✅ sudah dikenali
    if (!user) {
      return c.json({ error: "User tidak ditemukan dalam context" }, 401);
    }
    const requestedUserId = Number(c.req.param("userId"));

    if (user.id !== requestedUserId && user.role !== "admin") {
      return c.json({ error: "Anda tidak berhak mengakses file user lain" }, 403);
    }

    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, requestedUserId));

    return c.json({ message: "Data file berhasil diambil", data: files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return c.json({ error: "Terjadi kesalahan" }, 500);
  }
});

// GET /upload/:id
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

    return c.json({ message: "Data file berhasil diambil", data: file[0] });
  } catch (error) {
    console.error("Error fetching file:", error);
    return c.json({ error: "Terjadi kesalahan" }, 500);
  }
});

// DELETE /upload/:id
upload.delete("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const user = c.get("user"); // ✅ sudah dikenali
    if (!user) {
      return c.json({ error: "User tidak ditemukan dalam context" }, 401);
    }

    const files = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, id));

    // ✅ FIX 4: Guard file[0]
    const file = files[0];
    if (!file) {
      return c.json({ error: "File tidak ditemukan" }, 404);
    }

    if (file.userId !== user.id) {
      return c.json({ error: "Anda tidak berhak menghapus file ini" }, 403);
    }

    await deleteFile(file.fileName);
    await db.delete(fileUploads).where(eq(fileUploads.id, id));

    return c.json({ message: "File berhasil dihapus" });
  } catch (error) {
    console.error("Delete error:", error);
    return c.json({ error: "Terjadi kesalahan saat menghapus" }, 500);
  }
});

export default upload;