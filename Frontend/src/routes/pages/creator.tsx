import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { apiCall, API_ENDPOINTS } from '../../lib/api'
import { useToast } from '../../components/ToastContext'

export const Route = createFileRoute('/pages/creator')({
  component: RouteComponent,
})

type Creator = {
  id: number
  name: string
  niche: string
  followers: number
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter'
  status: 'active' | 'inactive'
  photo: string
  createdAt: string
}


const emptyForm = {
  name: '',
  niche: '',
  followers: 0,
  platform: '' as Creator['platform'],
  status: 'active' as Creator['status'],
  photo: '',
}

function RouteComponent() {
  const [creators, setCreators] = React.useState<Creator[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
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

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewPhoto(url)
    setForm({ ...form, photo: url })
  }

  function openAdd() {
    setForm(emptyForm)
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
    })
    setPreviewPhoto(creator.photo)
    setEditId(creator.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !form.niche) return
    setIsSaving(true)
    try {
      if (editId !== null) {
        const res = await apiCall(`${API_ENDPOINTS.creators}/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal update')
        const data = await res.json()
        const updated = data.data || data
        setCreators(creators.map((c) => c.id === editId ? updated : c))
        addToast('Creator berhasil diperbarui', 'success')
      } else {
        const res = await apiCall(API_ENDPOINTS.creators, {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal tambah')
        const data = await res.json()
        const created = data.data || data
        setCreators([...creators, created])
        addToast('Creator berhasil ditambahkan', 'success')
      }
      setShowForm(false)
      setForm(emptyForm)
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
                      src={creator.photo}
                      alt={creator.name}
                      className="w-9 h-9 rounded-full object-cover"
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
                <td className="px-5 py-3 text-gray-500">{creator.platform}</td>
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
              <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-4100 text-xs">Foto</span>
                )}
              </div>
              <div>
                <label className="text-xs text-blue-600 cursor-pointer border border-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-50">
                  Upload Foto
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG maks 2MB</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-black font-bold mb-1 block">Nama *</label>
                <input
                  type="string"
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
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah'}
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