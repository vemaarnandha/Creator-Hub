import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

interface UploadResponse {
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

interface FileUploadProps {
  onSuccess?: (data: UploadResponse["data"]) => void;
  onError?: (error: string) => void;
  relatedType?: "profile" | "creator" | "project" | "portfolio";
  relatedId?: number;
  maxSize?: number; // dalam bytes, default 5MB
  previewUrl?: string;
  apiUrl?: string; // ✅ FIX 4: Add configurable API URL
}

const FileUpload: React.FC<FileUploadProps> = ({
  onSuccess,
  onError,
  relatedType,
  relatedId,
  maxSize = 5 * 1024 * 1024,
  previewUrl,
  apiUrl = "http://localhost:3000", // ✅ FIX 4: Default API URL
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [fileName, setFileName] = useState<string>("");
  const [showError, setShowError] = useState(false); // ✅ FIX 5: Track error display

  // Mutation untuk upload
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      if (relatedType) formData.append("relatedType", relatedType);
      if (relatedId) formData.append("relatedId", relatedId.toString());

      const token = localStorage.getItem("token");
      // ✅ FIX 3: Check token availability
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login terlebih dahulu");
      }

      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json() as Promise<UploadResponse>;
    },
    onSuccess: (data) => {
      onSuccess?.(data.data);
      setShowError(false); // ✅ FIX 5: Clear error on success
      alert("✅ Upload berhasil!");
    },
    onError: (error: Error) => {
      onError?.(error.message);
      setShowError(true); // ✅ FIX 5: Show error state
      alert(`❌ ${error.message}`);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi ukuran
    if (file.size > maxSize) {
      alert(`❌ File terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("❌ Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF");
      return;
    }

    // Tampilkan preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setFileName(file.name);
      uploadMutation.mutate(file);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploadMutation.isPending}
      />

      {/* Preview atau Upload Button */}
      {preview ? (
        <div className="space-y-4">
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClick}
              disabled={uploadMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isPending ? "Uploading..." : "Pilih Foto Lain"}
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setFileName("");
                setShowError(false); // ✅ FIX 5: Clear error on reset
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={uploadMutation.isPending}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Hapus
            </button>
          </div>

          {fileName && (
            <p className="text-sm text-gray-600">📄 {fileName}</p>
          )}
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={uploadMutation.isPending}
          className="w-full h-40 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50"
        >
          <div className="text-4xl">📸</div>
          <div className="text-center">
            <p className="font-medium text-gray-700">Upload Foto</p>
            <p className="text-sm text-gray-500">JPG, PNG, WebP, atau GIF</p>
            <p className="text-xs text-gray-400">Max {maxSize / 1024 / 1024}MB</p>
          </div>
        </button>
      )}

      {/* Error Message */}
      {showError && uploadMutation.isError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            ❌ {(uploadMutation.error as Error).message}
          </p>
          <button
            onClick={() => setShowError(false)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
