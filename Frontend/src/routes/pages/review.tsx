import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { apiCall, API_ENDPOINTS } from '../../lib/api'

export const Route = createFileRoute('/pages/review')({
  component: RouteComponent,
})

type Review = {
  id: number
  creatorId?: number
  creatorName: string
  rating: number
  reviewText?: string
  comment?: string
  createdAt?: string
}

const emptyForm = { 
  creatorId: 0,
  rating: 5, 
  reviewText: '',
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}>
          <svg className={`w-6 h-6 ${s <= value ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function RouteComponent() {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [creators, setCreators] = React.useState<any[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  // Dioptimalkan dengan Promise.all untuk fetch paralel
  const fetchAllData = React.useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [resReviews, resCreators] = await Promise.all([
        apiCall(API_ENDPOINTS.reviews),
        apiCall(API_ENDPOINTS.creators)
      ])

      if (!resReviews.ok || !resCreators.ok) {
        throw new Error('Gagal mengambil data dari server')
      }

      const [dataRev, dataCre] = await Promise.all([
        resReviews.json(),
        resCreators.json()
      ])

      setReviews(Array.isArray(dataRev.data) ? dataRev.data : Array.isArray(dataRev) ? dataRev : [])
      setCreators(Array.isArray(dataCre.data) ? dataCre.data : Array.isArray(dataCre) ? dataCre : [])
    } catch (err) {
      setError('Gagal memuat data dashboard review.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const value = e.target.name === 'creatorId' ? Number(e.target.value) : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  function openAdd() { 
    setError('')
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true) 
  }

  function openEdit(r: Review) {
    setError('')
    setForm({ 
      creatorId: r.creatorId || 0,
      rating: r.rating, 
      reviewText: r.reviewText || r.comment || '',
    })
    setEditId(r.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.creatorId || form.rating < 1) {
      setError('Creator dan Rating harus diisi!')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      if (editId !== null) {
        const res = await apiCall(`${API_ENDPOINTS.reviews}/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal memperbarui review')
        const data = await res.json()
        let updated = data.data || data
        
        const creator = creators.find((c) => c.id === updated.creatorId)
        updated = {
          ...updated,
          creatorName: updated.creatorName || creator?.name || `Creator ${updated.creatorId}`,
        }
        setReviews(reviews.map((r) => r.id === editId ? updated : r))
      } else {
        const res = await apiCall(API_ENDPOINTS.reviews, {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal menambahkan review baru')
        const data = await res.json()
        let created = data.data || data
        
        const creator = creators.find((c) => c.id === created.creatorId)
        created = {
          ...created,
          creatorName: created.creatorName || creator?.name || `Creator ${created.creatorId}`,
        }
        setReviews([...reviews, created])
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditId(null)
      setSuccess(editId ? 'Review berhasil diupdate!' : 'Review berhasil ditambahkan!')
      setTimeout(() => setSuccess(''), 3000)
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
      const res = await apiCall(`${API_ENDPOINTS.reviews}/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus data')
      setReviews(reviews.filter((r) => r.id !== deleteId))
      setDeleteId(null)
      setSuccess('Review berhasil dihapus!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert('Gagal menghapus data review. Coba lagi.')
      console.error(err)
    }
  }

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '0'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Review</h1>
        <button 
          onClick={openAdd} 
          disabled={isLoading || isSaving} 
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Tambah Review
        </button>
      </div>

      {/* Message Banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAllData} className="text-red-700 font-medium hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-400 animate-pulse">Memuat data review...</p>
        </div>
      ) : (
        <>
          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
              <p className="text-xs text-gray-500">Rata-rata Rating</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">⭐ {avgRating}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-xs text-gray-500">Total Review</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{reviews.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-500">Rating 5 ⭐</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {reviews.filter((r) => r.rating === 5).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-400">
              <p className="text-xs text-gray-500">Rating &lt; 3</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {reviews.filter((r) => r.rating < 3).length}
              </p>
            </div>
          </div>

          {/* Cards Grid Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-lg shadow p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-gray-800">{r.creatorName || `Creator ${r.creatorId}`}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEdit(r)} 
                        className="text-xs px-2.5 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteId(r.id)} 
                        className="text-xs px-2.5 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <StarDisplay rating={r.rating} />
                  <p className="text-sm text-gray-600 italic">"{r.reviewText || '-'}"</p>
                </div>
                <div className="pt-2 border-t border-gray-50 text-xs text-gray-400">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-'}
                </div>
              </div>
            ))}
          </div>

          {reviews.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-400">Belum ada review. Klik "+ Tambah Review" untuk membuat.</p>
            </div>
          )}
        </>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800">
              {editId ? 'Edit Review Creator' : 'Tambah Review Baru'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Pilih Creator *</label>
                <select
                  value={form.creatorId}
                  onChange={handleChange}
                  name="creatorId"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value={0}>Pilih creator untuk di-rate</option>
                  {creators.map((creator) => (
                    <option key={creator.id} value={creator.id}>
                      {creator.name || `Creator ${creator.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Berikan Rating *</label>
                <StarInput value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Review / CatatanTambahan</label>
                <textarea 
                  name="reviewText" 
                  value={form.reviewText} 
                  onChange={handleChange} 
                  placeholder="Tulis opini singkat tentang performa creator ini..." 
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button 
                onClick={() => setShowForm(false)} 
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isSaving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Hapus Review?</h2>
            <p className="text-sm text-gray-500">
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
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
                className="text-sm px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
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