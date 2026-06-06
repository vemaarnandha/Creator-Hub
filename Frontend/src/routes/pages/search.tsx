import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { apiCall, API_ENDPOINTS, getImageUrl } from '../../lib/api'
import { useToast } from '../../components/ToastContext'

export const Route = createFileRoute('/pages/search')({
  component: RouteComponent,
})

type Creator = {
  id: number
  name: string
  niche: string
  followers: number
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter'
  status: 'active' | 'inactive'
  photo: string
  createdAt: string
}

type Client = {
  id: number
  name_brand: string
  industry: string
  email: string
  website: string
  phone: string
  address: string
  createdAt: string
}

type SearchResults = {
  creators: Creator[]
  clients: Client[]
}

function RouteComponent() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResults>({
    creators: [],
    clients: [],
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'all' | 'creators' | 'clients'>('all')
  const { addToast } = useToast()

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!searchQuery.trim()) {
      addToast('Masukkan kata kunci pencarian', 'error')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiCall(`${API_ENDPOINTS.search}?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Gagal mencari')

      const data = await res.json()
      setResults(data.data || { creators: [], clients: [] })
      setHasSearched(true)
      setActiveTab('all')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal melakukan pencarian'
      addToast(message, 'error')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalCreators = results.creators.length
  const totalClients = results.clients.length
  const totalResults = totalCreators + totalClients

  const displayCreators =
    activeTab === 'all' || activeTab === 'creators' ? results.creators : []
  const displayClients =
    activeTab === 'all' || activeTab === 'clients' ? results.clients : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pencarian</h1>
        <p className="text-gray-600 text-sm mt-1">
          Cari creator dan client berdasarkan nama atau industri
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari creator atau client..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⌛</span>
                Mencari...
              </>
            ) : (
              <>
                <span className="mr-2">🔍</span>
                Cari
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Summary */}
      {hasSearched && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Ditemukan <span className="font-semibold">{totalResults}</span> hasil untuk{' '}
            <span className="font-semibold">"{searchQuery}"</span>
            {totalResults > 0 && (
              <>
                {' '}({totalCreators} creator, {totalClients} client)
              </>
            )}
          </p>
        </div>
      )}

      {/* Tabs */}
      {hasSearched && totalResults > 0 && (
        <div className="bg-white rounded-lg shadow border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center transition ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Semua ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('creators')}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center transition ${
                activeTab === 'creators'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Creator ({totalCreators})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex-1 px-4 py-3 text-sm font-medium text-center transition ${
                activeTab === 'clients'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Client ({totalClients})
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {!hasSearched ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-600 text-lg font-medium">
              Mulai pencarian untuk menemukan creator dan client
            </p>
          </div>
        ) : totalResults === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
                d="M20.354 15.354A9 9 0 015.646 5.646 9.001 9.001 0 0020.354 15.354z"
              />
            </svg>
            <p className="text-gray-600 text-lg font-medium">
              Tidak ada hasil yang ditemukan
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Coba gunakan kata kunci lain
            </p>
          </div>
        ) : (
          <>
            {/* Creators Section */}
            {displayCreators.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Creator ({displayCreators.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="bg-white rounded-lg shadow hover:shadow-md transition p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {creator.photo ? (
                          <img
                            src={getImageUrl(creator.photo)}
                            alt={creator.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none'
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {creator.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {creator.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {creator.platform}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Niche:</span>
                          <span className="font-medium text-gray-800">
                            {creator.niche}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Followers:</span>
                          <span className="font-medium text-gray-800">
                            {creator.followers.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              creator.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {creator.status}
                          </span>
                        </div>
                      </div>

                      <button className="w-full px-3 py-2 border border-blue-300 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition">
                        Lihat Detail
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clients Section */}
            {displayClients.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Client ({displayClients.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayClients.map((client) => (
                    <div
                      key={client.id}
                      className="bg-white rounded-lg shadow hover:shadow-md transition p-4"
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {client.name_brand}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {client.industry}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span>📧</span>
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span>📱</span>
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span>🌐</span>
                          <span>{client.website}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span>📍</span>
                          <span className="truncate">{client.address}</span>
                        </div>
                      </div>

                      <button className="w-full px-3 py-2 border border-green-300 text-green-600 hover:bg-green-50 text-sm font-medium rounded-lg transition">
                        Lihat Detail
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}