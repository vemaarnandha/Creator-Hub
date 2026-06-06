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
      const deletedName = clients.find((c) => c.id === deleteId)?.name_brand || 'Client'
      setClients(clients.filter((c) => c.id !== deleteId))
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manajemen Client</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data mitra dan informasi brand client Anda.</p>
        </div>
        <button
          onClick={openAdd}
          disabled={isLoading || isSaving}
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Tambah Client
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-600 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
            <span>{error}</span>
          </div>
          <button onClick={fetchClients} className="text-red-700 font-semibold hover:text-red-800 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {/* Search Input Modern */}
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input
          type="text"
          placeholder="Cari brand, email, atau industri..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm text-gray-700 focus:outline-none bg-transparent"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards Modern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Client</p>
                <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
            </div>

            {/* Active Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Status Aktif</p>
                <p className="text-3xl font-bold text-gray-900">{clients.filter((c) => c.status === 'active').length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>

            {/* Inactive Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Tidak Aktif</p>
                <p className="text-3xl font-bold text-gray-900">{clients.filter((c) => c.status === 'inactive').length}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100 text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
              </div>
            </div>

            {/* Total Industry */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Kategori Industri</p>
                <p className="text-3xl font-bold text-gray-900">{new Set(clients.map((c) => c.industry)).size}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
            </div>
          </div>

          {/* Table Container Modern */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Industri</th>
                    <th className="px-6 py-4">Kontak</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                          <p className="text-sm text-gray-500 font-medium">{search ? 'Tidak ada client ditemukan' : 'Belum ada data client'}</p>
                          {!search && <p className="text-xs text-gray-400 mt-1">Klik tambah client untuk memulai</p>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                              {client.name_brand.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-900 font-semibold">{client.name_brand}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{client.industry}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-800">{client.email}</span>
                            {client.phone && <span className="text-xs text-gray-500 mt-0.5">{client.phone}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            client.status === 'active'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {client.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(client)}
                              disabled={isDeleting}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button
                              onClick={() => setDeleteId(client.id)}
                              disabled={isDeleting}
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                              title="Hapus"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Form Tambah / Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? 'Edit Client' : 'Tambah Client'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nama Brand <span className="text-red-500">*</span></label>
                <input
                  name="name_brand"
                  value={form.name_brand}
                  onChange={handleChange}
                  placeholder="Contoh: Tokopedia"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Industri <span className="text-red-500">*</span></label>
                <input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Contoh: E-Commerce"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email <span className="text-red-500">*</span></label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="kontak@brand.com"
                  type="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">No. Telepon</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                disabled={isSaving}
                className="text-sm font-medium px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-sm font-medium px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 shadow-sm transition-all flex items-center"
              >
                {isSaving && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {isSaving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Hapus Client?</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus client <span className="font-semibold text-gray-900">"{clients.find((c) => c.id === deleteId)?.name_brand}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-600 font-medium">{deleteError}</p>
              </div>
            )}
            <div className="flex justify-center gap-3 pt-4 mt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setDeleteId(null)
                  setDeleteError('')
                }}
                disabled={isDeleting}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 shadow-sm transition-colors flex items-center justify-center"
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