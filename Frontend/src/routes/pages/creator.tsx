import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { apiCall, API_ENDPOINTS, getImageUrl } from '../../lib/api'
import { useToast } from '../../components/ToastContext'

export const Route = createFileRoute('/pages/creator')({
  component: RouteComponent,
})

type Creator = {
  id: number
  name: string
  niche: string
  followers: string // Diubah ke string karena placeholder menerima format "100K"
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter'
  status: 'active' | 'inactive'
  photo: string
  createdAt: string
}

// Diubah agar tidak bentrok dengan global FormData bawaan browser
type CreatorFormData = {
  name: string
  niche: string
  followers: string
  platform: Creator['platform']
  status: Creator['status']
  photo: string
  isPhotoUploading?: boolean
}

const emptyForm: CreatorFormData = {
  name: '',
  niche: '',
  followers: '',
  platform: 'instagram', // Default disamakan dengan option pertama agar tidak kosong
  status: 'active',
  photo: '',
  isPhotoUploading: false,
}

function RouteComponent() {
  const [creators, setCreators] = React.useState<Creator[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState<CreatorFormData>(emptyForm)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [previewPhoto, setPreviewPhoto] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState('')
  const { addToast } = useToast()

  React.useEffect(() => {
    fetchCreators()
  }, [])

  async function fetchCreators() {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiCall(API_ENDPOINTS.creators)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()
      setCreators(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Gagal memuat data creator. Periksa koneksi ke server.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran file
    const MAX_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_SIZE) {
      addToast('Ukuran foto terlalu besar. Maksimal 2MB', 'error')
      return
    }

    // Validasi tipe file
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      addToast('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF', 'error')
      return
    }

    // Set preview untuk UX yang lebih baik
    const previewUrl = URL.createObjectURL(file)
    setPreviewPhoto(previewUrl)

    // Upload file ke server
    setForm({ ...form, isPhotoUploading: true })
    try {
      const formDataObj = new FormData() // Menggunakan browser FormData tanpa bentrok nama tipe
      formDataObj.append('file', file)
      formDataObj.append('relatedType', 'creator')

      const token = localStorage.getItem('token')
      if (!token) {
        addToast('Token tidak ditemukan. Silakan login terlebih dahulu', 'error')
        setForm({ ...form, isPhotoUploading: false })
        return
      }

      const response = await fetch(API_ENDPOINTS.upload, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataObj,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload gagal')
      }

      const data = await response.json()
      const filePath = data.data?.filePath || `${data.data?.fileName}`
      setForm({ ...form, photo: filePath, isPhotoUploading: false })
      addToast('Foto berhasil diupload', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal upload foto'
      addToast(message, 'error')
      setPreviewPhoto('')
      setForm({ ...form, photo: '', isPhotoUploading: false })
      console.error('Upload error:', err)
    }
  }

  function openAdd() {
    setForm({ ...emptyForm, isPhotoUploading: false })
    setPreviewPhoto('')
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(creator: Creator) {
    setForm({
      name: creator.name,
      niche: creator.niche,
      followers: creator.followers,
      platform: creator.platform,
      status: creator.status,
      photo: creator.photo,
      isPhotoUploading: false,
    })
    setPreviewPhoto(getImageUrl(creator.photo))
    setEditId(creator.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.niche) return
    setIsSaving(true)
    try {
      const dataToSave = {
        name: form.name,
        niche: form.niche,
        followers: form.followers,
        platform: form.platform,
        status: form.status,
        photo: form.photo,
      }

      if (editId !== null) {
        const res = await apiCall(`${API_ENDPOINTS.creators}/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSave),
        })
        if (!res.ok) throw new Error('Gagal update')
        const data = await res.json()
        const updated = data.data || data
        setCreators(creators.map((c) => c.id === editId ? updated : c))
        addToast('Creator berhasil diperbarui', 'success')
      } else {
        const res = await apiCall(API_ENDPOINTS.creators, {
          method: 'POST',
          body: JSON.stringify(dataToSave),
        })
        if (!res.ok) throw new Error('Gagal tambah')
        const data = await res.json()
        const created = data.data || data
        setCreators([...creators, created])
        addToast('Creator berhasil ditambahkan', 'success')
      }
      setShowForm(false)
      setForm({ ...emptyForm, isPhotoUploading: false })
      setPreviewPhoto('')
      setEditId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan creator'
      addToast(message, 'error')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteId === null) return
    try {
      setIsDeleting(true)
      const res = await apiCall(`${API_ENDPOINTS.creators}/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal hapus')
      const deletedName = creators.find(c => c.id === deleteId)?.name || 'Creator'
      setCreators(creators.filter((c) => c.id !== deleteId))
      addToast(`${deletedName} berhasil dihapus`, 'success')
      setDeleteId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus creator. Coba lagi.'
      addToast(message, 'error')
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Creator</h1>
        <button
          onClick={openAdd}
          disabled={isLoading || isDeleting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Tambah Creator
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCreators} className="text-red-700 font-medium hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Foto</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Nama</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Niche</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Followers</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Platform</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {creators.map((creator) => (
              <tr key={creator.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  {creator.photo ? (
                    <img
                      src={getImageUrl(creator.photo)}
                      alt={creator.name}
                      className="w-9 h-9 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {creator.name.charAt(0)}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-800 font-medium">{creator.name}</td>
                <td className="px-5 py-3 text-gray-500">{creator.niche}</td>
                <td className="px-5 py-3 text-gray-500">{creator.followers}</td>
                <td className="px-5 py-3 text-gray-500 capitalize">{creator.platform}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${creator.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                    }`}>
                    {creator.status}
                  </span>
                </td>
                <td className="px-5 py-3 flex gap-2">
                  <button
                    onClick={() => openEdit(creator)}
                    disabled={isDeleting}
                    className="text-xs px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(creator.id)}
                    disabled={isDeleting}
                    className="text-xs px-3 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {editId ? 'Edit Creator' : 'Tambah Creator'}
            </h2>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center relative">
                {previewPhoto ? (
                  <>
                    <img 
                      src={previewPhoto} 
                      alt="preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    {form.isPhotoUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">Foto</span>
                )}
              </div>
              <div className="flex-1">
                <label className="text-xs text-blue-600 cursor-pointer border border-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-50 inline-block">
                  {form.isPhotoUploading ? 'Upload...' : 'Upload Foto'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhoto}
                    disabled={form.isPhotoUploading}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG maks 2MB</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-black font-bold mb-1 block">Nama *</label>
                <input
                  type="text" // Diperbaiki dari "string" ke "text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nama creator"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-black font-bold mb-1 block">Niche *</label>
                <input
                  type="text"
                  name="niche"
                  value={form.niche}
                  onChange={handleChange}
                  placeholder="Lifestyle, Tech, Beauty..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-black font-bold mb-1 block">Followers</label>
                <input
                  type="text"
                  name="followers"
                  value={form.followers}
                  onChange={handleChange}
                  placeholder="contoh: 100K"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-black font-bold mb-1 block">Platform</label>
                <select
                  name="platform"
                  value={form.platform}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-black font-bold mb-1 block">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                disabled={isSaving || form.isPhotoUploading}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || form.isPhotoUploading}
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? 'Menyimpan...' : form.isPhotoUploading ? 'Upload foto...' : editId ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Hapus Creator?</h2>
            <p className="text-sm text-gray-500">
              Creator <span className="font-medium text-gray-700">
                {creators.find((c) => c.id === deleteId)?.name}
              </span> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}