import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { apiCall, API_ENDPOINTS } from '../../lib/api'
import { useToast } from '../../components/ToastContext'

export const Route = createFileRoute('/pages/notifcation')({
  component: RouteComponent,
})

type Notification = {
  id: number
  userId: number
  title: string
  message: string
  type: 'deadline' | 'campaign' | 'system'
  isRead: boolean
  createdAt: string
}

function RouteComponent() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [filterType, setFilterType] = React.useState<'all' | 'deadline' | 'campaign' | 'system'>('all')
  const { addToast } = useToast()

  React.useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setIsLoading(true)
    try {
      const res = await apiCall(API_ENDPOINTS.notifications)
      if (!res.ok) throw new Error('Gagal mengambil notifikasi')
      const data = await res.json()
      setNotifications(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat notifikasi'
      addToast(message, 'error')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkAsRead(id: number) {
    try {
      const res = await apiCall(`${API_ENDPOINTS.notifications}/${id}/read`, {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('Gagal menandai sebagai dibaca')
      
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
      )
      addToast('Notifikasi ditandai sudah dibaca', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengupdate notifikasi'
      addToast(message, 'error')
      console.error(err)
    }
  }

  async function handleMarkAsUnread(id: number) {
    try {
      const res = await apiCall(`${API_ENDPOINTS.notifications}/${id}/unread`, {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('Gagal menandai sebagai belum dibaca')
      
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, isRead: false } : n
        )
      )
      addToast('Notifikasi ditandai belum dibaca', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengupdate notifikasi'
      addToast(message, 'error')
      console.error(err)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await apiCall(`${API_ENDPOINTS.notifications}/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus notifikasi')
      
      setNotifications(notifications.filter((n) => n.id !== id))
      addToast('Notifikasi berhasil dihapus', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus notifikasi'
      addToast(message, 'error')
      console.error(err)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead)
      
      await Promise.all(
        unreadNotifications.map((n) =>
          apiCall(`${API_ENDPOINTS.notifications}/${n.id}/read`, {
            method: 'PUT',
          })
        )
      )

      setNotifications(notifications.map((n) => ({ ...n, isRead: true })))
      addToast('Semua notifikasi ditandai sudah dibaca', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengupdate notifikasi'
      addToast(message, 'error')
      console.error(err)
    }
  }

  async function handleDeleteAll() {
    try {
      await Promise.all(
        notifications.map((n) =>
          apiCall(`${API_ENDPOINTS.notifications}/${n.id}`, {
            method: 'DELETE',
          })
        )
      )

      setNotifications([])
      addToast('Semua notifikasi berhasil dihapus', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus notifikasi'
      addToast(message, 'error')
      console.error(err)
    }
  }

  const filteredNotifications =
    filterType === 'all'
      ? notifications
      : notifications.filter((n) => n.type === filterType)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const typeColors: Record<string, { bg: string; text: string; label: string }> = {
    deadline: { bg: 'bg-red-100', text: 'text-red-700', label: 'Deadline' },
    campaign: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Campaign' },
    system: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'System' },
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifikasi</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} notifikasi belum dibaca
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
            >
              Tandai Semua Dibaca
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('deadline')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
              filterType === 'deadline'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Deadline
          </button>
          <button
            onClick={() => setFilterType('campaign')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
              filterType === 'campaign'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Campaign
          </button>
          <button
            onClick={() => setFilterType('system')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
              filterType === 'system'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            System
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-600 font-medium">Tidak ada notifikasi</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const color = typeColors[notif.type]
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 transition ${
                  notif.isRead
                    ? 'border-l-gray-300 opacity-75'
                    : 'border-l-blue-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {notif.title}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
                      >
                        {color.label}
                      </span>
                      {!notif.isRead && (
                        <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notif.isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-3 py-1 text-xs rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 transition"
                        title="Tandai sebagai dibaca"
                      >
                        ✓ Baca
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsUnread(notif.id)}
                        className="px-3 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                        title="Tandai sebagai belum dibaca"
                      >
                        ↻ Belum Baca
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="px-3 py-1 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition"
                      title="Hapus notifikasi"
                    >
                      ✕ Hapus
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}