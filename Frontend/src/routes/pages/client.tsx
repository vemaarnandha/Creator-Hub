import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, API_ENDPOINTS } from '../../lib/api'
import { useToast } from '../../components/ToastContext'

export const Route = createFileRoute('/pages/client')({
  component: RouteComponent,
})

// Tipe data Client (sesuai dengan schema)
type Client = {
  id: number
  name_brand: string
  industry: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  createdAt?: string
}

// Form state type
type ClientForm = {
  name_brand: string
  industry: string
  email: string
  phone: string
  status: string
}

const emptyForm: ClientForm = {
  name_brand: '',
  industry: '',
  email: '',
  phone: '',
  status: 'active',
}

function RouteComponent() {
  const [clients, setClients] = React.useState<Client[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string>('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState('')
  const { addToast } = useToast()

  // Fetch clients dari backend
  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      setIsLoading(true)
      setError('')
      const data = await apiGet<{ message: string; data: Client[] }>(API_ENDPOINTS.clients)
      setClients(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat client'
      setError(message)
      console.error('Error fetching clients:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(client: Client) {
    setForm({
      name_brand: client.name_brand,
      industry: client.industry,
      email: client.email,
      phone: client.phone,
      status: client.status,
    })
    setEditId(client.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name_brand || !form.industry || !form.email) {
      setError('Nama Brand, Industri, dan Email harus diisi!')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      const payload = {
        name_brand: form.name_brand,
        industry: form.industry,
        email: form.email,
        phone: form.phone,
        status: form.status,
      }

      if (editId !== null) {
        await apiPut(`${API_ENDPOINTS.clients}/${editId}`, payload)
        addToast('Client berhasil diperbarui', 'success')
      } else {
        await apiPost(API_ENDPOINTS.clients, payload)
        addToast('Client berhasil ditambahkan', 'success')
      }

      await fetchClients()
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan client'
      setError(message)
      addToast(message, 'error')
      console.error('Error saving client:', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteId === null) return

    try {
      setIsDeleting(true)
      setDeleteError('')
      await apiDelete(`${API_ENDPOINTS.clients}/${deleteId}`)
      const deletedName = clients.find(c => c.id === deleteId)?.name_brand || 'Client'
      setClients(clients.filter(c => c.id !== deleteId))
      addToast(`${deletedName} berhasil dihapus`, 'success')
      setDeleteId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus client'
      setDeleteError(message)
      addToast(message, 'error')
      console.error('Error deleting client:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter berdasarkan search
  const filtered = clients.filter((c) =>
    c.name_brand.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Client</h1>
        <button
          onClick={openAdd}
          disabled={isLoading || isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Tambah Client
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow px-4 py-3">
        <input
          type="text"
          placeholder="Cari brand, email, atau industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm text-gray-700 focus:outline-none"
        />
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Memuat data client...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-xs text-gray-500">Total Client</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{clients.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {clients.filter((c) => c.status === 'active').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
              <p className="text-xs text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {clients.filter((c) => c.status === 'inactive').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-xs text-gray-500">Industri</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {new Set(clients.map((c) => c.industry)).size}
              </p>
            </div>
          </div>

          {/* Tabel */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Brand</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Industri</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Email</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Telepon</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Status</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                      {search ? 'Tidak ada client ditemukan' : 'Belum ada data client'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar inisial brand */}
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
                            {client.name_brand.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-800 font-medium">{client.name_brand}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{client.industry}</td>
                      <td className="px-5 py-3 text-gray-500">{client.email}</td>
                      <td className="px-5 py-3 text-gray-500">{client.phone}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${client.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                          }`}>
                          {client.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(client)}
                            disabled={isDeleting}
                            className="text-xs px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(client.id)}
                            disabled={isDeleting}
                            className="text-xs px-3 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Form Tambah / Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {editId ? 'Edit Client' : 'Tambah Client'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nama Brand *</label>
                <input
                  name="name_brand"
                  value={form.name_brand}
                  onChange={handleChange}
                  placeholder="Nama brand"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Industri *</label>
                <input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Nama Industri"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@brand.com"
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">No. Telepon</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                disabled={isSaving}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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

      {/* Modal Konfirmasi Hapus */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Hapus Client?</h2>
            <p className="text-sm text-gray-500">
              Client <span className="font-medium text-gray-700">
                {clients.find((c) => c.id === deleteId)?.name_brand}
              </span> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-xs text-red-600">{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteId(null)
                  setDeleteError('')
                }}
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