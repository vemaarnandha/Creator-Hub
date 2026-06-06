import { Hono } from "hono";
import type { Variables } from "../types/hono-env";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/authMiddleware";
import bcrypt from "bcryptjs";
import { processUpload, deleteFile } from "../utils/fileHandler";

const settings = new Hono<{ Variables: Variables }>();

settings.use("*", authMiddleware);

// GET profile admin saat ini
settings.get("/profile", async (c) => {
  const user = c.get("user");

  const profile = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      profile_photo: users.profile_photo,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, user.id));

  return c.json({
    message: "Success",
    data: profile[0],
  });
});
// PUT Update Profile dengan file upload handling
settings.put("/profile", async (c) => {
  try {
    const user = c.get("user");

    // ✅ Try parse as formData dengan fallback
    let formData: FormData;
    try {
      formData = await c.req.formData();
      console.log("✅ FormData parsed successfully");
    } catch (parseError) {
      console.error("❌ FormData parse error:", parseError);
      console.log("🔍 Content-Type:", c.req.header("content-type"));
      console.log("🔍 Body size:", c.req.raw.body?.length || "unknown");
      return c.json(
        {
          error:
            "Format data tidak valid. Pastikan mengirim FormData dengan multipart/form-data",
          details: String(parseError),
        },
        400,
      );
    }

    console.log("🔍 DEBUG - FormData keys:", Array.from(formData.keys()));

    const updateData: any = {};

    // Get text fields
    const name = formData.get("name");
    const email = formData.get("email");

    if (name && typeof name === "string") {
      updateData.name = name;
      console.log("✅ Name:", name);
    }
    if (email && typeof email === "string") {
      updateData.email = email;
      console.log("✅ Email:", email);
    }

    // Get file
    const profileFile = formData.get("profile_photo");

    console.log("🔍 Profile file:", profileFile);
    console.log("🔍 Has arrayBuffer?", typeof (profileFile as any)?.arrayBuffer);

    // ✅ ROBUST FILE HANDLING - support Node.js FormData
    if (profileFile && typeof (profileFile as any).arrayBuffer === "function") {
      try {
        const buffer = await (profileFile as any).arrayBuffer();
        const bufferData = Buffer.from(buffer);

        console.log("✅ File received, buffer size:", bufferData.length);
        console.log("✅ File name:", (profileFile as any).name);
        console.log("✅ File type:", (profileFile as any).type);

        const uploadResult = await processUpload(
          bufferData,
          (profileFile as any).type || "application/octet-stream",
          (profileFile as any).name || "photo.jpg",
          "profile"
        );

        console.log("📤 Upload result:", uploadResult);

        // FIX [PATH_VALIDATION]: Verify path format sebelum save ke DB
        if (uploadResult.filePath) {
          console.log("✅ ==== UPLOAD RESULT ====");
          console.log("🔍 fileName:", uploadResult.fileName);
          console.log("🔍 filePath:", uploadResult.filePath);
          console.log("🔍 fileSize:", uploadResult.fileSize);
          console.log("🔍 STARTS WITH /uploads?", uploadResult.filePath.startsWith("/uploads"));
          console.log("🔍 CONTAINS public/?", uploadResult.filePath.includes("public/"));
          
          if (!uploadResult.filePath.startsWith("/uploads")) {
            console.error("❌ CRITICAL: Path format wrong! Should start with /uploads, got:", uploadResult.filePath);
            return c.json({ error: "Invalid file path format" }, 500);
          }
        }

        if (!uploadResult.success) {
          return c.json({ error: uploadResult.error }, 400);
        }

        // Hapus file lama
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id));

        if (currentUser[0]?.profile_photo) {
          const oldFileName = currentUser[0].profile_photo.split("/").pop();
          if (oldFileName) await deleteFile(oldFileName);
        }

        updateData.profile_photo = uploadResult.filePath;
      } catch (fileError) {
        console.error("❌ File processing error:", fileError);
        return c.json({ error: "Gagal memproses file: " + String(fileError) }, 400);
      }
    } else {
      console.warn("⚠️ No file received or invalid file object");
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ message: "Tidak ada data yang diupdate" }, 400);
    }

    // FIX [DRIZZLE_RETURNING]: Don't rely on .returning() - explicitly SELECT after UPDATE
    // SQLite + Drizzle .returning() might not include all fields
    const updateResult = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    // After update, explicitly fetch the complete user record
    const fetchedUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profile_photo: users.profile_photo,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, user.id));

    if (!fetchedUser || fetchedUser.length === 0) {
      return c.json({ message: "Gagal mengupdate profile" }, 400);
    }

    // FIX [RESPONSE_VALIDATION]: Log exact response untuk debug path issue
    const responseData = fetchedUser[0];
    console.log("🔍 RESPONSE PAYLOAD - profile_photo field:", responseData.profile_photo);
    console.log("🔍 RESPONSE PAYLOAD - all fields:", Object.keys(responseData));
    console.log("🔍 RESPONSE PAYLOAD - full object:", JSON.stringify(responseData, null, 2));

    return c.json({
      message: "Profile berhasil diupdate",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    return c.json({ error: "Terjadi kesalahan: " + String(error) }, 500);
  }
});
export default settings;
