import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import { useFileUpload, useFileDelete } from "../lib/useFileUpload";

/**
 * EXAMPLE 1: Menggunakan FileUpload Component
 * Cocok untuk form yang memerlukan upload foto dengan preview
 */
export function CreatorFormExample() {
  const [formData, setFormData] = useState({
    name: "",
    platform: "instagram",
    photoPath: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ✅ FIX 7: Proper form submission

    if (!formData.name) {
      setMessage("❌ Nama creator wajib diisi");
      return;
    }

    if (!formData.photoPath) {
      setMessage("❌ Foto profil wajib diupload");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/creators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          platform: formData.platform,
          photo: formData.photoPath,
        }),
      });

      if (response.ok) {
        setMessage("✅ Creator berhasil dibuat!");
        setFormData({ name: "", platform: "instagram", photoPath: "" });
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.message || "Gagal membuat creator"}`);
      }
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : "Error tidak diketahui"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Buat Creator Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium mb-2">Nama Creator</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nama creator"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Platform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Foto Profil</label>
            <FileUpload
              relatedType="creator"
              onSuccess={(data) => {
                setFormData({ ...formData, photoPath: data.filePath });
                console.log("Photo uploaded:", data);
              }}
              onError={(error) => {
                setMessage(`❌ Upload gagal: ${error}`);
              }}
            />
            {formData.photoPath && (
              <p className="mt-2 text-sm text-green-600">✅ Foto berhasil diupload</p>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg ${message.includes("✅") ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <p className={`text-sm ${message.includes("✅") ? "text-green-700" : "text-red-700"}`}>
                {message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Menyimpan..." : "Simpan Creator"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 2: Menggunakan useFileUpload Hook
 * Cocok untuk kontrol penuh atas proses upload
 */
export function AdvancedUploadExample({ apiUrl = "http://localhost:3000" }: { apiUrl?: string }) {
  const { mutate: uploadFile, isPending, error, data } = useFileUpload({
    relatedType: "portfolio",
    maxSize: 3 * 1024 * 1024, // 3MB
    apiUrl, // ✅ FIX 4: Pass configurable API URL
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Upload Portfolio</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isPending}
      />

      {isPending && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
          <span>Uploading...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          ❌ {error.message}
        </div>
      )}

      {data && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <p>✅ File berhasil diupload!</p>
          <p className="text-sm text-gray-600 mt-1">
            Path: {data.data.filePath}
          </p>
          <p className="text-sm text-gray-600">
            Size: {(data.data.fileSize / 1024).toFixed(2)} KB
          </p>
          {/* Tampilkan preview */}
          <img
            src={`http://localhost:3000${data.data.filePath}`}
            alt="Uploaded"
            className="mt-3 w-40 h-40 object-cover rounded"
          />
        </div>
      )}
    </div>
  );
}

/**
 * EXAMPLE 3: File Manager
 * Menampilkan dan manage uploaded files
 */
export function FileManagerExample({ userId, apiUrl = "http://localhost:3000" }: { userId: number; apiUrl?: string }) {
  const [files, setFiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const { mutate: deleteFile } = useFileDelete(apiUrl);

  // Fetch files
  React.useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Token tidak ditemukan. Silakan login terlebih dahulu");
          setLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/upload/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal mengambil file");
        }

        const data = await res.json();
        setFiles(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengambil file");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [userId, apiUrl]);

  const handleDelete = (fileId: number) => {
    if (confirm("Yakin ingin menghapus file ini?")) {
      deleteFile(fileId, {
        onSuccess: () => {
          setFiles(files.filter((f) => f.id !== fileId));
        },
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">File Manager ({files.length})</h3>

      {files.length === 0 ? (
        <p className="text-gray-500">Tidak ada file</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={`${apiUrl}${file.filePath}`}
                alt={file.fileName}
                className="w-full h-full object-cover"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDelete(file.id)}
                  className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>

              {/* File info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                <p className="truncate">{file.fileName}</p>
                <p>{(file.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * EXAMPLE 4: Profile Photo Update
 * Update foto profil user
 */
export function ProfilePhotoUpdate({ apiUrl = "http://localhost:3000" }: { apiUrl?: string }) {
  const [photoUrl, setPhotoUrl] = React.useState<string>(
    localStorage.getItem("userPhotoUrl") || ""
  );

  return (
    <div className="p-6 max-w-sm">
      <h3 className="text-lg font-semibold mb-4">Ubah Foto Profil</h3>

      {photoUrl && (
        <div className="mb-4 aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
        </div>
      )}

      <FileUpload
        relatedType="profile"
        apiUrl={apiUrl}
        onSuccess={(data) => {
          const fullUrl = `${apiUrl}${data.filePath}`;
          setPhotoUrl(fullUrl);
          localStorage.setItem("userPhotoUrl", fullUrl);
          localStorage.setItem("userPhotoId", data.id.toString());
        }}
      />
    </div>
  );
}
