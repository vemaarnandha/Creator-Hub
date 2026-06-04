import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { apiCall, API_ENDPOINTS } from '../../lib/api'

export const Route = createFileRoute('/pages/collaboration')({
  component: RouteComponent,
})

type Collaboration = {
  id: number
  projectName: string
  clientId: number
  clientName: string
  creatorIds: number[]
  creatorNames: string[]
  description: string
  budget: number
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  createdAt?: string
}

const emptyForm = {
  projectName: '',
  clientId: 0,
  clientName: '',
  creatorIds: [] as number[],
  creatorNames: [] as string[],
  description: '',
  budget: 0,
  status: 'planning' as Collaboration['status'],
  startDate: '',
  endDate: '',
}

function RouteComponent() {
  const [collaborations, setCollaborations] = React.useState<Collaboration[]>([])
  const [creators, setCreators] = React.useState<any[]>([])
  const [clients, setClients] = React.useState<any[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  // Fetch data saat halaman dibuka
  React.useEffect(() => {
    fetchCollaborations()
    fetchCreators()
    fetchClients()
  }, [])

  async function fetchCollaborations() {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiCall(API_ENDPOINTS.projects)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()
      setCollaborations(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Gagal memuat data collaboration.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchCreators() {
    try {
      const res = await apiCall(API_ENDPOINTS.creators)
      if (!res.ok) throw new Error('Gagal mengambil creator')
      const data = await res.json()
      setCreators(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchClients() {
    try {
      const res = await apiCall(API_ENDPOINTS.clients)
      if (!res.ok) throw new Error('Gagal mengambil client')
      const data = await res.json()
      setClients(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm({ ...form, [name]: name === "budget" ? Number(value) : value })
  }

  function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const clientId = Number(e.target.value)
    const client = clients.find((c) => c.id === clientId)
    setForm({
      ...form,
      clientId,
      clientName: client?.name_brand ?? client?.brandName ?? '',
    })
  }

  function toggleCreator(creatorId: number, creatorName: string) {
    // Safe check for creatorIds
    const currentIds = Array.isArray(form.creatorIds) ? form.creatorIds : []
    const currentNames = Array.isArray(form.creatorNames) ? form.creatorNames : []
    
    const isSelected = currentIds.includes(creatorId)
    if (isSelected) {
      setForm({
        ...form,
        creatorIds: currentIds.filter((id) => id !== creatorId),
        creatorNames: currentNames.filter((name) => name !== creatorName),
      })
    } else {
      setForm({
        ...form,
        creatorIds: [...currentIds, creatorId],
        creatorNames: [...currentNames, creatorName],
      })
    }
  }

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(collab: Collaboration) {
    setForm({
      projectName: collab.projectName || '',
      clientId: collab.clientId || 0,
      clientName: collab.clientName || '',
      creatorIds: Array.isArray(collab.creatorIds) ? collab.creatorIds : [],
      creatorNames: Array.isArray(collab.creatorNames) ? collab.creatorNames : [],
      description: collab.description || '',
      budget: collab.budget || 0,
      status: collab.status || 'planning',
      startDate: collab.startDate || '',
      endDate: collab.endDate || '',
    })
    setEditId(collab.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.projectName || !form.clientId || !Array.isArray(form.creatorIds) || form.creatorIds.length === 0) {
      setError('Project name, client, dan minimal 1 creator harus dipilih!')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      if (editId !== null) {
        const res = await apiCall(`${API_ENDPOINTS.projects}/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal update')
        const data = await res.json()
        const updated = data.data || data
        setCollaborations(collaborations.map((c) => c.id === editId ? updated : c))
      } else {
        const res = await apiCall(API_ENDPOINTS.projects, {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal tambah')
        const data = await res.json()
        const created = data.data || data
        setCollaborations([...collaborations, created])
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
      setError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data. Coba lagi.'
      setError(message)
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteId === null) return
    try {
      const res = await apiCall(`${API_ENDPOINTS.projects}/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal hapus')
      setCollaborations(collaborations.filter((c) => c.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert('Gagal menghapus data. Coba lagi.')
      console.error(err)
    }
  }

  const statusColors = {
    planning: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels = {
    planning: 'Planning',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Collaboration</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Tambah Project
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCollaborations} className="text-red-700 font-medium hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Project</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Client</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Creator</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Budget</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">

            {/* Loading */}
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}

            {/* Empty */}
            {!isLoading && collaborations.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                  Belum ada collaboration. Klik "+ Tambah Project" untuk memulai.
                </td>
              </tr>
            )}

            {/* Data */}
            {!isLoading && collaborations.map((collab) => (
              <tr key={collab.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-800 font-medium">{collab.projectName}</td>
                <td className="px-5 py-3 text-gray-500">{collab.clientName ?? '-'}</td>
                <td className="px-5 py-3 text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(collab.creatorNames) && collab.creatorNames.slice(0, 2).map((name, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                        {name}
                      </span>
                    ))}
                    {Array.isArray(collab.creatorNames) && collab.creatorNames.length > 2 && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        +{collab.creatorNames.length - 2}
                      </span>
                    )}
                    {!Array.isArray(collab.creatorNames) || collab.creatorNames.length === 0 && (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500">Rp {collab.budget?.toLocaleString('id-ID') ?? '0'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[collab.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {statusLabels[collab.status] ?? collab.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(collab)}
                      className="text-xs px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(collab.id)}
                      className="text-xs px-3 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800">
              {editId ? 'Edit Collaboration' : 'Tambah Collaboration'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nama Project *</label>
                <input
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  placeholder="Nama project..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Client *</label>
                  <select
                    value={form.clientId}
                    onChange={handleClientChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value={0}>Pilih client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name_brand || client.brandName || client.name || 'Unnamed Client'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Budget</label>
                  <input
                    type="number"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="0"
                    min={0}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Deskripsi</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detail project..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Assign Creators *</label>
                <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {creators.length === 0 ? (
                    <p className="text-xs text-gray-400 col-span-2 py-2">Belum ada creator. Buat creator terlebih dahulu.</p>
                  ) : (
                    creators.map((creator) => (
                      <label key={creator.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={Array.isArray(form.creatorIds) && form.creatorIds.includes(creator.id)}
                          onChange={() => toggleCreator(creator.id, creator.name)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-600">{creator.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {Array.isArray(form.creatorIds) && form.creatorIds.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Minimal 1 creator harus dipilih</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
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
                {isSaving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Hapus Collaboration?</h2>
            <p className="text-sm text-gray-500">
              Project <span className="font-medium text-gray-700">
                {collaborations.find((c) => c.id === deleteId)?.projectName ?? 'ini'}
              </span> akan dihapus permanen.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="text-sm px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
