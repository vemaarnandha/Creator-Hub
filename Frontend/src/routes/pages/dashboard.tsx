import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
    fetchDashboardData()
    fetchRecentProjects()
  }, [])

  async function fetchDashboardData() {
    try {
      setIsLoading(true)
      setError('')
      const data = await apiGet<{ message: string; data: DashboardData }>(API_ENDPOINTS.dashboard)
      setDashboardData(data.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data dashboard'
      setError(message)
      console.error('Error fetching dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchRecentProjects() {
    try {
      const data = await apiGet<{ message: string; data: RecentProject[] }>(
        `${API_ENDPOINTS.dashboard}/recent`
      )
      setRecentProjects(data.data || [])
    } catch (err) {
      console.error('Error fetching recent projects:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">Memuat data dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Project per Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboardData?.projectsByStatus || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {dashboardData?.projectsByStatus.map((item) => (
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
          </div>
        </div>

      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Recent Projects</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
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
                  <td className="px-5 py-3 text-gray-800">{project.projectName || project.title}</td>
                  <td className="px-5 py-3 text-gray-500">{project.clientName || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' :
                      project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-3 text-center text-gray-500">
                  No projects yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
 )
}