import { promises as fs } from "fs";
import { join } from "path";
import crypto from "crypto";

// Konstanta
const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

export interface UploadResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

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
  const ext = originalName.split(".").pop();
  return `${timestamp}-${random}.${ext}`;
};

/**
 * Simpan file ke disk
 */
export const saveFile = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadResult> => {
  try {
    // Buat folder uploads jika belum ada
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Tentukan path penyimpanan
    const filePath = join(UPLOAD_DIR, fileName);
    const relativeFilePath = `/uploads/${fileName}`;

    // Simpan file
    await fs.writeFile(filePath, buffer);

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
export const deleteFile = async (fileName: string): Promise<boolean> => {
  try {
    const filePath = join(UPLOAD_DIR, fileName);
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
  originalName: string
): Promise<UploadResult> => {
  // Validasi file
  const validation = validateFile(buffer, mimeType, originalName);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Generate unique filename
  const fileName = generateFileName(originalName);

  // Simpan file
  const saveResult = await saveFile(buffer, fileName);
  return saveResult;
};