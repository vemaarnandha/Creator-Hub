export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'

export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/auth/login`,
  logout: `${API_BASE_URL}/auth/logout`,
  user: `${API_BASE_URL}/auth/me`,

  // Dashboard
  dashboard: `${API_BASE_URL}/dashboard`,

  // Creators
  creators: `${API_BASE_URL}/creators`,

  // Clients
  clients: `${API_BASE_URL}/clients`,

  // Collaboration/Projects
  projects: `${API_BASE_URL}/collaboration/projects`,
  collaboration: `${API_BASE_URL}/collaboration`,
  projectAssign: `${API_BASE_URL}/collaboration/assign`,

  // Invoices
  invoices: `${API_BASE_URL}/invoices`,

  // Reviews/Ratings
  reviews: `${API_BASE_URL}/reviews`,

  // Schedules/Posts
  schedules: `${API_BASE_URL}/schedule`,

  // Settings
  settings: `${API_BASE_URL}/settings`,
}

export async function apiCall(
  url: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token')

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  })
}

// Helper functions untuk CRUD operations
export async function apiGet<T>(url: string): Promise<T> {
  const res = await apiCall(url)
  if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`)
  const data = await res.json()
  return data
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  const res = await apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || `HTTP error! status: ${res.status}`)
  }
  return res.json()
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<T> {
  const res = await apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || `HTTP error! status: ${res.status}`)
  }
  return res.json()
}

export async function apiDelete(endpoint: string): Promise<void> {
  const res = await apiCall(endpoint, { method: 'DELETE' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || `HTTP error! status: ${res.status}`)
  }
}