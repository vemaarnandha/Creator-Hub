import { promises as fs } from "fs";
import { join } from "path";
import crypto from "crypto";

// Konstanta
const UPLOADS_BASE_DIR = join(process.cwd(), "public/uploads");
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

// Tentukan folder berdasarkan tipe upload
const getUploadDir = (relatedType?: string | null): string => {
  const type = relatedType || "profiles";
  return join(UPLOADS_BASE_DIR, type);
};

export interface UploadResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validasi file sebelum upload
 */
export const validateFile = (
  buffer: Buffer,
  mimeType: string,
  originalName: string
): { valid: boolean; error?: string } => {
  // Validasi mime type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF" };
  }

  // Validasi ukuran file
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: "Ukuran file terlalu besar. Maksimal 5MB" };
  }

  // Validasi extensi file
  const ext = originalName.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "Ekstensi file tidak valid" };
  }

  return { valid: true };
};

/**
 * Generate unique filename dengan timestamp + random
 */
export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  
  // ✅ FIX 3: Handle edge case file tanpa extension
  const parts = originalName.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : "jpg";
  
  return `${timestamp}-${random}.${ext}`;
};

/**
 * Simpan file ke disk
 */
export const saveFile = async (
  buffer: Buffer,
  fileName: string,
  relatedType?: string | null
): Promise<UploadResult> => {
  try {
    const uploadDir = getUploadDir(relatedType);
    
    // FIX [ENSURE_FOLDER]: Ensure upload directory exists with explicit logging
    console.log("🔍 Upload dir:", uploadDir);
    console.log("🔍 Current working directory:", process.cwd());
    
    // Create directory with recursive flag
    await fs.mkdir(uploadDir, { recursive: true });
    console.log("✅ Upload directory created/verified:", uploadDir);

    // Tentukan path penyimpanan
    const filePath = join(uploadDir, fileName);
    // ✅ FIX: Return URL path (/) bukan filesystem path (public/)
    const relativeFilePath = `/uploads/${relatedType || 'profiles'}/${fileName}`;

    console.log("📝 About to write file:");
    console.log("  Filesystem path:", filePath);
    console.log("  Buffer size:", buffer.length, "bytes");

    // Simpan file
    await fs.writeFile(filePath, buffer);
    console.log("✅ FILE WRITTEN TO DISK");

    // FIX [VERIFY_SAVE]: Verify file was actually saved with detailed checks
    try {
      const savedFile = await fs.stat(filePath);
      console.log("✅ FILE VERIFIED ON DISK");
      console.log("  Size on disk:", savedFile.size, "bytes");
      console.log("  File path:", filePath);
      console.log("  URL path:", relativeFilePath);
      
      if (savedFile.size !== buffer.length) {
        console.warn("⚠️ WARNING: Saved file size differs from buffer!");
      }
    } catch (statError) {
      console.error("❌ ERROR: Could not verify saved file:", statError);
      throw statError;
    }

    return {
      success: true,
      fileName,
      filePath: relativeFilePath,
      fileSize: buffer.length,
      mimeType: getMimeType(fileName),
    };
  } catch (error) {
    console.error("Error saving file:", error);
    return {
      success: false,
      error: "Gagal menyimpan file",
    };
  }
};

/**
 * Hapus file dari disk
 */
export const deleteFile = async (fileName: string, relatedType?: string | null): Promise<boolean> => {
  try {
    const uploadDir = getUploadDir(relatedType);
    const filePath = join(uploadDir, fileName);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

/**
 * Dapatkan MIME type berdasarkan ekstensi
 */
const getMimeType = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
};

/**
 * Process file upload dari request
 */
export const processUpload = async (
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  relatedType?: string | null
): Promise<UploadResult> => {
  // Validasi file
  const validation = validateFile(buffer, mimeType, originalName);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Generate unique filename
  const fileName = generateFileName(originalName);

  // Simpan file
  const saveResult = await saveFile(buffer, fileName, relatedType);
  return saveResult;
};
