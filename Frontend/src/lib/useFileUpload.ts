import { useMutation } from "@tanstack/react-query";

interface UploadFileResponse {
  message: string;
  data: {
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  };
}

interface UseUploadOptions {
  relatedType?: "profile" | "creator" | "project" | "portfolio";
  relatedId?: number;
  maxSize?: number;
  apiUrl?: string;
}

/**
 * Custom hook untuk handle file upload
 * 
 * @example
 * const { uploadFile, isLoading, error, data } = useFileUpload({
 *   relatedType: 'creator',
 *   relatedId: 1
 * });
 * 
 * const handleFileSelect = async (file: File) => {
 *   await uploadFile(file);
 * };
 */
export const useFileUpload = (options: UseUploadOptions = {}) => {
  const {
    relatedType,
    relatedId,
    maxSize = 5 * 1024 * 1024,
    apiUrl = "http://localhost:3000",
  } = options;

  return useMutation({
    mutationFn: async (file: File) => {
      // Validasi file
      if (file.size > maxSize) {
        throw new Error(`File terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB`);
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF");
      }

      // ✅ FIX 3: Check token before upload
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login terlebih dahulu");
      }

      // Buat FormData
      const formData = new FormData();
      formData.append("file", file);
      
      if (relatedType) {
        formData.append("relatedType", relatedType);
      }
      
      if (relatedId) {
        formData.append("relatedId", relatedId.toString());
      }

      // Upload
      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload gagal");
      }

      return response.json() as Promise<UploadFileResponse>;
    },
  });
};

/**
 * Custom hook untuk delete file
 */
export const useFileDelete = (apiUrl = "http://localhost:3000") => {
  return useMutation({
    mutationFn: async (fileId: number) => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login terlebih dahulu");
      }

      const response = await fetch(`${apiUrl}/upload/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Delete gagal");
      }

      return response.json();
    },
  });
};

/**
 * Custom hook untuk fetch file metadata
 */
export const useFileMetadata = (fileId: number, apiUrl = "http://localhost:3000") => {
  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login terlebih dahulu");
      }

      const response = await fetch(`${apiUrl}/upload/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || "Gagal mengambil metadata file");
        } catch {
          throw new Error("Gagal mengambil metadata file");
        }
      }

      return response.json() as Promise<UploadFileResponse>;
    },
  });
};
