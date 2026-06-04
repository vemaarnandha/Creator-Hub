import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { apiCall, API_ENDPOINTS } from '../../lib/api'

export const Route = createFileRoute('/pages/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await apiCall(API_ENDPOINTS.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      console.log('LOGIN RESPONSE:', data)

      if (!res.ok) {
        setError(data.message || 'Login gagal')
        return
      }

      localStorage.setItem('token', data.token)

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // Trigger auth check in root component
      window.dispatchEvent(new Event('auth-change'))

      navigate({ to: '/pages/dashboard' })
    } catch (err) {
      console.error(err)
      setError('Tidak dapat terhubung ke server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-blue-600 p-3">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CreatorHub</h1>
          <p className="mt-2 text-sm text-gray-600">Masuk ke akun Anda</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
            >
              {isLoading ? 'Sedang Login...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun? <span className="font-semibold text-blue-600">Hubungi admin</span>
        </p>
      </div>
    </div>
  )
}