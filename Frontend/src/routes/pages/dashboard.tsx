import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { apiGet, API_ENDPOINTS } from '../../lib/api'

export const Route = createFileRoute('/pages/dashboard')({
  component: DashboardComponent,
})

type DashboardData = {
  totalCreators: number
  totalClients: number
  totalProjects: number
  activeProjects: number
  assignedCreators: number
  projectsByStatus: { status: string; total: number }[]
}

type RecentProject = {
  id: number
  projectName: string
  title: string
  clientName: string
  status: string
  createdAt: string
}

type StatCard = {
  label: string
  value: number
  color: string
}

function DashboardComponent() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAllDashboardData() {
      try {
        setIsLoading(true)
        setError('')
        
        // Menggunakan Promise.all agar request berjalan paralel
        const [dashboardRes, recentRes] = await Promise.all([
          apiGet<{ message: string; data: DashboardData }>(API_ENDPOINTS.dashboard),
          apiGet<{ message: string; data: RecentProject[] }>(`${API_ENDPOINTS.dashboard}/recent`)
        ])

        setDashboardData(dashboardRes.data)
        setRecentProjects(recentRes.data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal memuat data dashboard'
        setError(message)
        console.error('Error fetching dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 text-sm">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 dynamic"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  const stats: StatCard[] = dashboardData ? [
    { label: 'Total Creators', value: dashboardData.totalCreators, color: 'border-blue-500' },
    { label: 'Total Clients', value: dashboardData.totalClients, color: 'border-green-500' },
    { label: 'Total Projects', value: dashboardData.totalProjects, color: 'border-yellow-500' },
    { label: 'Active Projects', value: dashboardData.activeProjects, color: 'border-red-500' },
  ] : []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`bg-white rounded-lg shadow p-5 border-l-4 ${item.color}`}
          >
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Project per Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboardData?.projectsByStatus || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} className="capitalize" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {/* Diperbaiki dengan optional chaining aman (?.) */}
            {dashboardData?.projectsByStatus?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: item.status === 'planning' ? '#ef4444' : 
                                    item.status === 'ongoing' ? '#f59e0b' :
                                    item.status === 'completed' ? '#10b981' : '#6b7280'
                  }}></div>
                  <span className="text-sm text-gray-700 capitalize">{item.status}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.total}</span>
              </div>
            ))}
            {(!dashboardData?.projectsByStatus || dashboardData.projectsByStatus.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">Tidak ada data status</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Recent Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-gray-600 font-medium">Project</th>
                <th className="px-5 py-3 text-left text-gray-600 font-medium">Client</th>
                <th className="px-5 py-3 text-left text-gray-600 font-medium">Status</th>
                <th className="px-5 py-3 text-left text-gray-600 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-800 font-medium">{project.projectName || project.title}</td>
                    <td className="px-5 py-3 text-gray-500">{project.clientName || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' :
                        project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    Belum ada project saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}