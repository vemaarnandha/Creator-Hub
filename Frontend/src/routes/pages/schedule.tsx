import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../../lib/api'

export const Route = createFileRoute('/pages/schedule')({
  component: RouteComponent,
})

type Schedule = {
  id: number
  title: string
  creator: string
  client: string
  date: string
  time: string
  platform: string
  status: 'scheduled' | 'posted' | 'cancelled'
  projectId?: number
  creatorId?: number
  contentType?: string
  caption?: string
  postingDate?: string
}

const emptyForm = {
  projectId: 0,
  creatorId: 0,
  postingDate: new Date().toISOString().split('T')[0],
  platform: '',
  contentType: '',
  caption: '',
  status: 'scheduled' as Schedule['status'],
}

function RouteComponent() {
  const [schedules, setSchedules] = React.useState<Schedule[]>([])
  const [creators, setCreators] = React.useState<any[]>([])
  const [projects, setProjects] = React.useState<any[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  useEffect(() => {
    fetchSchedules()
    fetchCreators()
    fetchProjects()
  }, [])

  async function fetchSchedules() {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiCall(API_ENDPOINTS.schedules)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()
      setSchedules(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Gagal memuat data schedule.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchCreators() {
    try {
      const res = await apiCall(API_ENDPOINTS.creators)
      if (!res.ok) throw new Error('Gagal mengambil creators')
      const data = await res.json()
      setCreators(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchProjects() {
    try {
      const res = await apiCall(API_ENDPOINTS.projects)
      if (!res.ok) throw new Error('Gagal mengambil projects')
      const data = await res.json()
      setProjects(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const value = e.target.name === 'projectId' || e.target.name === 'creatorId' ? Number(e.target.value) : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  function handleCreatorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm({ ...form, creatorId: Number(e.target.value) })
  }

  function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm({ ...form, projectId: Number(e.target.value) })
  }

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(s: Schedule) {
    setForm({
      projectId: s.projectId ?? 0,
      creatorId: s.creatorId ?? 0,
      postingDate: s.date || s.postingDate || new Date().toISOString().split('T')[0],
      platform: s.platform,
      contentType: s.contentType || '',
      caption: s.caption || '',
      status: s.status as any,
    })
    setEditId(s.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.projectId || !form.creatorId || !form.postingDate || !form.platform) {
      setError('Project, Creator, Tanggal, dan Platform harus diisi!')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      if (editId !== null) {
        const res = await apiCall(`${API_ENDPOINTS.schedules}/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal update')
        const data = await res.json()
        let updated = data.data || data
        // Ensure creator and project names are populated
        const creator = creators.find((c) => c.id === updated.creatorId)
        const project = projects.find((p) => p.id === updated.projectId)
        updated = {
          ...updated,
          creator: updated.creator || creator?.name || '',
          title: updated.title || project?.projectName || project?.title || '',
          client: project?.clientName || '',
        }
        setSchedules(schedules.map((s) => s.id === editId ? updated : s))
      } else {
        const res = await apiCall(API_ENDPOINTS.schedules, {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal tambah')
        const data = await res.json()
        let created = data.data || data
        // Ensure creator and project names are populated
        const creator = creators.find((c) => c.id === created.creatorId)
        const project = projects.find((p) => p.id === created.projectId)
        created = {
          ...created,
          creator: created.creator || creator?.name || '',
          title: created.title || project?.projectName || project?.title || '',
          client: project?.clientName || '',
        }
        setSchedules([...schedules, created])
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
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
      const res = await apiCall(`${API_ENDPOINTS.schedules}/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal hapus')
      setSchedules(schedules.filter((s) => s.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert('Gagal menghapus data. Coba lagi.')
      console.error(err)
    }
  }

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    posted: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-500',
  }

  const statusLabels: Record<string, string> = {
    scheduled: 'Scheduled',
    posted: 'Posted',
    cancelled: 'Cancelled',
  }

  const grouped = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const key = (s.date || s.postingDate || '').slice(0, 7)
    if (!key || !acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Schedule</h1>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Tambah Jadwal
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSchedules} className="text-red-700 font-medium hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {(['scheduled', 'posted', 'cancelled'] as const).map((s) => (
          <div key={s} className={`bg-white rounded-lg shadow p-4 border-l-4 ${s === 'scheduled' ? 'border-blue-500' : s === 'posted' ? 'border-green-500' : 'border-red-400'}`}>
            <p className="text-xs text-gray-500">{statusLabels[s]}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{schedules.filter((x) => x.status === s).length}</p>
          </div>
        ))}
      </div>

      {Object.keys(grouped).sort().reverse().map((month) => (
        <div key={month}>
          <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Tanggal</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Judul</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Creator</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Client</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Platform</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Status</th>
                  <th className="px-5 py-3 text-left text-gray-600 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                      Memuat data...
                    </td>
                  </tr>
                )}
                {!isLoading && grouped[month].sort((a, b) => (a.date || a.postingDate || '').localeCompare(b.date || b.postingDate || '')).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-800">
                      <p className="font-medium">{new Date(s.date || s.postingDate || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{s.title || s.caption || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{s.creator || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{s.client || '-'}</td>
                    <td className="px-5 py-3 text-gray-500">{s.platform}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status] ?? 'bg-gray-100 text-gray-500'}`}>{statusLabels[s.status] ?? s.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-xs px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50">Edit</button>
                        <button onClick={() => setDeleteId(s.id)} className="text-xs px-3 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-50">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800">{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Creator *</label>
                  <select
                    value={form.creatorId}
                    onChange={handleCreatorChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value={0}>Pilih creator</option>
                    {creators.length === 0 ? (
                      <option disabled>Tidak ada creator</option>
                    ) : (
                      creators.map((creator) => (
                        <option key={creator.id} value={creator.id}>
                          {creator.name || `Creator ${creator.id}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Project *</label>
                  <select
                    value={form.projectId}
                    onChange={handleProjectChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value={0}>Pilih project</option>
                    {projects.length === 0 ? (
                      <option disabled>Tidak ada project</option>
                    ) : (
                      projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.projectName || project.title || `Project ${project.id}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tanggal *</label>
                  <input
                    type="date"
                    name="postingDate"
                    value={form.postingDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Platform *</label>
                  <select
                    name="platform"
                    value={form.platform}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Pilih platform</option>
                    {['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipe Konten</label>
                <input
                  type="text"
                  name="contentType"
                  value={form.contentType}
                  onChange={handleChange}
                  placeholder="e.g., Video, Carousel, Reel..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Caption/Deskripsi</label>
                <textarea
                  name="caption"
                  value={form.caption}
                  onChange={handleChange}
                  placeholder="Detail caption..."
                  rows={3}
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
                  <option value="scheduled">Scheduled</option>
                  <option value="posted">Posted</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
            <h2 className="text-lg font-semibold text-gray-800">Hapus Jadwal?</h2>
            <p className="text-sm text-gray-500">
              Jadwal <span className="font-medium text-gray-700">
                {schedules.find((s) => s.id === deleteId)?.title || schedules.find((s) => s.id === deleteId)?.caption || 'ini'}
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