import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { apiCall, API_ENDPOINTS, getImageUrl } from "../../lib/api";

export const Route = createFileRoute("/pages/settings")({
  component: RouteComponent,
});

type Profile = {
  id?: number;
  name: string;
  email: string;
  role?: string;
  profile_photo?: string;
  photo?: string;
};

function RouteComponent() {
  const [profile, setProfile] = React.useState<Profile>({
    name: "",
    email: "",
    role: "",
    photo: "",
  });

  const [form, setForm] = React.useState<Profile>(profile);
  const [previewPhoto, setPreview] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [tab, setTab] = React.useState<"profile" | "password">("profile");
  const [password, setPassword] = React.useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [pwMsg, setPwMsg] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setIsLoading(true);
      setError("");
      const res = await apiCall(API_ENDPOINTS.user);
      if (!res.ok) throw new Error("Gagal mengambil data profil");
      const data = await res.json();
      const userData = data.user || data.data || data;
      setProfile(userData);
      setForm(userData);

      // FIX [IMAGE_URL]: Convert relative path to full backend URL
      if (userData.profile_photo) {
        const fullImageUrl = getImageUrl(userData.profile_photo);
        console.log("📸 FetchProfile - Full image URL:", fullImageUrl);
        setPreview(fullImageUrl);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat profil";
      setError(message);
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url); // Preview lokal
    // ✅ UBAH dari 'photo' ke 'profile_photo'
    setForm({ ...form, profile_photo: url });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      setError("");
      const endpoint = `${API_ENDPOINTS.settings}/profile`;

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);

      if (fileInputRef.current?.files?.[0]) {
        formData.append("profile_photo", fileInputRef.current.files[0]);
        console.log("📁 File appended:", fileInputRef.current.files[0].name);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan profil");
      }

      const data = await res.json();

      // FIX [RESPONSE_PARSING]: Log exact response structure untuk debug path issue
      console.log("🔍 EXACT RESPONSE:", JSON.stringify(data, null, 2));
      console.log("🔍 data.data existence?", data.data);
      console.log("🔍 data.user existence?", data.user);

      // ✅ Robust response handling
      const updated = data.user || data.data || data;
      if (!updated) {
        throw new Error("Format response tidak valid");
      }

      console.log("📤 PARSED Response updated:", JSON.stringify(updated, null, 2));
      console.log("📸 Profile photo VALUE:", updated.profile_photo);
      console.log("📸 Profile photo TYPE:", typeof updated.profile_photo);
      console.log("📸 Profile photo IS NULL?", updated.profile_photo === null);
      console.log("📸 Profile photo IS UNDEFINED?", updated.profile_photo === undefined);

      setProfile(updated);
      setForm(updated);

      if (updated.profile_photo) {
        // FIX [IMAGE_URL]: Convert relative path to full backend URL before rendering
        const fullImageUrl = getImageUrl(updated.profile_photo);
        console.log("✅ SETTING PREVIEW TO FULL URL:", fullImageUrl);
        setPreview(fullImageUrl);
        console.log("✅ Preview state should be set now");

        // ✅ CLEAR file input setelah upload
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
          console.log("🧹 File input cleared");
        }
      } else {
        console.warn(
          "⚠️ profile_photo tidak ada atau kosong di response:",
          Object.keys(updated),
        );
        console.warn("⚠️ CRITICAL: profile_photo field missing - image won't load!");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan profil";
      setError(message);
      console.error("Error:", err);
    } finally {
      setIsSaving(false);
    }
  }
  async function handlePassword() {
    if (!password.current) {
      setPwMsg("Masukkan password saat ini.");
      return;
    }
    if (password.new.length < 6) {
      setPwMsg("Password baru minimal 6 karakter.");
      return;
    }
    if (password.new !== password.confirm) {
      setPwMsg("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      const res = await apiCall(`${API_ENDPOINTS.settings}/change-password`, {
        method: "PUT",
        body: JSON.stringify({
          oldPassword: password.current,
          newPassword: password.new,
        }),
      });

      if (!res.ok) throw new Error("Gagal mengubah password");

      setPwMsg("✓ Password berhasil diubah!");
      setPassword({ current: "", new: "", confirm: "" });
      setTimeout(() => setPwMsg(""), 2500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengubah password";
      setPwMsg(message);
      setTimeout(() => setPwMsg(""), 2500);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {(["profile", "password"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "profile" ? "Profil Admin" : "Ubah Password"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Memuat profil...</p>
        </div>
      ) : (
        <>
          {tab === "profile" && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                  {previewPhoto ? (
                    <>
                      {console.log("🖼️ RENDERING IMAGE - Full URL:", previewPhoto)}
                      {console.log("🖼️ Is full URL (http)?", previewPhoto.startsWith('http'))}
                      <img
                        src={previewPhoto}
                        alt="foto"
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          console.log("✅ IMAGE LOADED SUCCESSFULLY");
                          console.log("   URL used:", previewPhoto);
                        }}
                        onError={(e) => {
                          console.error("❌ IMAGE LOAD FAILED");
                          console.error("   URL attempted:", previewPhoto);
                          console.error("   Error:", e);
                        }}
                      />
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-blue-500">
                      {form.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-lg">
                    {profile.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {profile.role || "User"} · {profile.agency || "Agency"}
                  </p>
                  <label className="mt-2 inline-block text-sm text-blue-600 cursor-pointer border border-blue-300 px-3 py-1 rounded-md hover:bg-blue-50">
                    Ganti Foto
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhoto}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Nama Lengkap
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nama admin"
                    disabled={isSaving}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Email
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@..."
                    disabled={isSaving}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Role
                  </label>
                  <input
                    name="role"
                    value={form.role || ""}
                    onChange={handleChange}
                    placeholder="Admin, Manager..."
                    disabled={isSaving}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-6 py-2 rounded-lg"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                {saved && (
                  <span className="text-sm text-green-600">
                    ✓ Profil berhasil disimpan!
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === "password" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-700">
                    Ubah Password
                  </h2>
                  {[
                    { label: "Password Saat Ini", name: "current" },
                    { label: "Password Baru", name: "new" },
                    { label: "Konfirmasi Password Baru", name: "confirm" },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="text-xs text-gray-500 mb-1 block">
                        {f.label}
                      </label>
                      <input
                        type="password"
                        value={(password as any)[f.name]}
                        onChange={(e) =>
                          setPassword({ ...password, [f.name]: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handlePassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg"
                    >
                      Ubah Password
                    </button>
                    {pwMsg && (
                      <span
                        className={`text-sm ${pwMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}
                      >
                        {pwMsg}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-5 space-y-3 h-fit">
                  <p className="text-sm font-semibold text-blue-700">
                    Tips Password Aman
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Minimal 6 karakter",
                      "Kombinasi huruf besar & kecil",
                      "Gunakan angka atau simbol",
                      "Jangan gunakan tanggal lahir",
                      "Jangan bagikan password ke siapapun",
                    ].map((tip) => (
                      <li
                        key={tip}
                        className="flex items-start gap-2 text-sm text-blue-600"
                      >
                        <span className="mt-0.5">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}