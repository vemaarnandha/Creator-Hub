import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format, isSameDay } from 'date-fns'
import { id } from 'date-fns/locale'
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

// Injeksi CSS Kustom untuk mempercantik react-calendar agar sesuai dengan Tailwind
const calendarStyles = `
  .custom-calendar { border: none !important; width: 100% !important; font-family: inherit !important; background: transparent !important; }
  .custom-calendar .react-calendar__navigation button { font-weight: 600; font-size: 1rem; border-radius: 0.5rem; padding: 0.5rem; color: #1f2937; }
  .custom-calendar .react-calendar__navigation button:enabled:hover { background-color: #f3f4f6; }
  .custom-calendar .react-calendar__month-view__weekdays { text-transform: uppercase; font-size: 0.75rem; font-weight: 700; color: #6b7280; padding-bottom: 0.5rem; }
  .custom-calendar .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
  .custom-calendar .react-calendar__tile { padding: 0.75rem 0.5rem; border-radius: 0.5rem; font-size: 0.875rem; color: #374151; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 80px; }
  .custom-calendar .react-calendar__tile:enabled:hover, .custom-calendar .react-calendar__tile:enabled:focus { background-color: #f3f4f6; }
  .custom-calendar .react-calendar__tile--now { background: #eff6ff; color: #2563eb; font-weight: 600; }
  .custom-calendar .react-calendar__tile--now:enabled:hover { background: #dbeafe; }
  .custom-calendar .react-calendar__tile--active { background: #2563eb !important; color: white !important; font-weight: 600; }
  .custom-calendar .react-calendar__tile--active .schedule-badge { background: white !important; color: #2563eb !important; border-color: transparent !important; }
`

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
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [calendarValue, setCalendarValue] = React.useState<Date>(new Date())

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
    setForm({
      ...emptyForm,
      postingDate: format(selectedDate, 'yyyy-MM-dd'),
    })
    setEditId(null)
    setShowForm(true)
  }

  function openAddFromCalendar(date: Date) {
    setSelectedDate(date)
    setForm({
      ...emptyForm,
      postingDate: format(date, 'yyyy-MM-dd'),
    })
    setEditId(null)
    setShowForm(true)
  }

  function getSchedulesForDate(date: Date): Schedule[] {
    return schedules.filter((s) => {
      const scheduleDate = s.date || s.postingDate || ''
      return isSameDay(new Date(scheduleDate), date)
    })
  }

  function getTileContent(date: Date) {
    const daySchedules = getSchedulesForDate(date)
    if (daySchedules.length === 0) return null
    return (
      <div className="mt-1.5 w-full flex flex-col gap-1 px-1">
        {daySchedules.slice(0, 2).map((s) => (
          <div key={s.id} className="schedule-badge text-[10px] px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-md w-full truncate text-center font-medium">
            {s.platform}
          </div>
        ))}
        {daySchedules.length > 2 && (
          <div className="text-[10px] text-gray-500 font-medium">+{daySchedules.length - 2} lagi</div>
        )}
      </div>
    )
  }

  function openEdit(s: Schedule) {
    const scheduleDate = new Date(s.date || s.postingDate || '')
    setSelectedDate(scheduleDate)
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
    scheduled: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    posted: 'bg-green-50 text-green-700 ring-green-600/20',
    cancelled: 'bg-red-50 text-red-700 ring-red-600/10',
  }

  const statusBorder: Record<string, string> = {
    scheduled: 'border-l-blue-500',
    posted: 'border-l-green-500',
    cancelled: 'border-l-red-500',
  }

  const statusLabels: Record<string, string> = {
    scheduled: 'Scheduled',
    posted: 'Posted',
    cancelled: 'Cancelled',
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Content Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan pantau jadwal posting konten Anda.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Tambah Jadwal
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-600 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
            <span>{error}</span>
          </div>
          <button onClick={fetchSchedules} className="text-red-700 font-semibold hover:text-red-800 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(['scheduled', 'posted', 'cancelled'] as const).map((s) => (
          <div key={s} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{statusLabels[s]}</p>
              <p className="text-3xl font-bold text-gray-900">{schedules.filter((x) => x.status === s).length}</p>
            </div>
            <div className={`p-3 rounded-full ${s === 'scheduled' ? 'bg-blue-50 text-blue-600' : s === 'posted' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {s === 'scheduled' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
              {s === 'posted' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
              {s === 'cancelled' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <Calendar
            value={calendarValue}
            onChange={(value) => {
              if (value instanceof Date) {
                setCalendarValue(value)
              }
            }}
            tileContent={({ date }) => getTileContent(date)}
            onClickDay={(date) => openAddFromCalendar(date)}
            locale="id"
            className="custom-calendar"
          />
        </div>

        {/* Schedules for Selected Date */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{format(selectedDate, 'EEEE', { locale: id })}</p>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : getSchedulesForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                <p className="text-sm text-gray-500 font-medium">Tidak ada jadwal</p>
                <p className="text-xs text-gray-400 mt-1">Klik kalender untuk menambah</p>
              </div>
            ) : (
              getSchedulesForDate(selectedDate).map((s) => (
                <div key={s.id} className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group border-l-4 ${statusBorder[s.status]}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">{s.platform}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${statusColor[s.status] ?? 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                          {statusLabels[s.status] ?? s.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-600">{s.creator || 'Tanpa Creator'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 line-clamp-2">{s.title || s.caption || <span className="italic text-gray-400">Tidak ada deskripsi</span>}</p>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(s)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex-1">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(s.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors flex-1">
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Jadwal Konten' : 'Buat Jadwal Baru'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Creator <span className="text-red-500">*</span></label>
                  <select value={form.creatorId} onChange={handleCreatorChange} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value={0}>Pilih creator...</option>
                    {creators.map((creator) => (
                      <option key={creator.id} value={creator.id}>{creator.name || `Creator ${creator.id}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Project <span className="text-red-500">*</span></label>
                  <select value={form.projectId} onChange={handleProjectChange} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value={0}>Pilih project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.projectName || project.title || `Project ${project.id}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Tanggal Posting <span className="text-red-500">*</span></label>
                  <input type="date" name="postingDate" value={form.postingDate} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Platform <span className="text-red-500">*</span></label>
                  <select name="platform" value={form.platform} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="">Pilih platform...</option>
                    {['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Tipe Konten</label>
                  <input type="text" name="contentType" value={form.contentType} onChange={handleChange} placeholder="Contoh: Video, Reels, Carousel..." className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="scheduled">Scheduled</option>
                    <option value="posted">Posted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Caption / Deskripsi</label>
                <textarea name="caption" value={form.caption} onChange={handleChange} placeholder="Tulis caption atau catatan brief di sini..." rows={4} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="text-sm font-medium px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={isSaving} className="text-sm font-medium px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                {isSaving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Jadwal?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="text-sm font-medium px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 flex-1">
                Batal
              </button>
              <button onClick={handleDelete} className="text-sm font-medium px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 flex-1">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}