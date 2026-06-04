import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { apiCall, API_ENDPOINTS } from '../../lib/api'

export const Route = createFileRoute('/pages/invoice')({
  component: RouteComponent,
})

type Invoice = {
  id: number
  invoiceNumber: string
  clientId: number
  clientName: string
  projectId: number
  projectName: string
  amount: number
  description: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  issueDate: string
  createdAt?: string
}

const emptyForm = {
  invoiceNumber: '',
  clientId: 0,
  clientName: '',
  projectId: 0,
  projectName: '',
  amount: 0,
  description: '',
  status: 'draft' as Invoice['status'],
  dueDate: '',
  issueDate: new Date().toISOString().split('T')[0],
}

function RouteComponent() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [clients, setClients] = React.useState<any[]>([])
  const [collaborations, setCollaborations] = React.useState<any[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [searchFilter, setSearchFilter] = React.useState('')

  // Fetch data saat halaman dibuka
  React.useEffect(() => {
    fetchInvoices()
    fetchClients()
    fetchCollaborations()
  }, [])

  async function fetchInvoices() {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiCall(API_ENDPOINTS.invoices)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()
      setInvoices(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Gagal memuat data invoice.')
      console.error(err)
    } finally {
      setIsLoading(false)
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

  async function fetchCollaborations() {
    try {
      const res = await apiCall(API_ENDPOINTS.projects)
      if (!res.ok) throw new Error('Gagal mengambil collaboration')
      const data = await res.json()
      setCollaborations(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const clientId = Number(e.target.value)
    const client = clients.find((c) => c.id === clientId)
    setForm({
      ...form,
      clientId,
      clientName: client ? (client.name_brand || client.brandName || client.name || '') : '',
    })
  }

  function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const projectId = Number(e.target.value)
    const project = collaborations.find((p) => p.id === projectId)
    setForm({
      ...form,
      projectId,
      projectName: project ? (project.projectName || project.title || '') : '',
      amount: project?.budget ?? 0,
    })
  }

  function generateInvoiceNumber() {
    const date = new Date()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const random = Math.floor(Math.random() * 10000)
    return `INV-${year}${month}-${String(random).padStart(4, '0')}`
  }

  function openAdd() {
    setForm({
      ...emptyForm,
      invoiceNumber: generateInvoiceNumber(),
    })
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(invoice: Invoice) {
    setForm({
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      projectId: invoice.projectId,
      projectName: invoice.projectName,
      amount: invoice.amount,
      description: invoice.description,
      status: invoice.status,
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate,
    })
    setEditId(invoice.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.invoiceNumber || !form.clientId) {
      setError('Invoice Number dan Client harus diisi!')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      if (editId !== null) {
        const res = await apiCall(`${API_ENDPOINTS.invoices}/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal update')
        const data = await res.json()
        let updated = data.data || data
        // Ensure clientName and projectName are populated from lookup
        const client = clients.find((c) => c.id === updated.clientId)
        const project = collaborations.find((p) => p.id === updated.projectId)
        updated = {
          ...updated,
          clientName: updated.clientName || client?.name_brand || client?.brandName || client?.name || '',
          projectName: updated.projectName || project?.projectName || project?.title || '',
        }
        setInvoices(invoices.map((inv) => inv.id === editId ? updated : inv))
      } else {
        const res = await apiCall(API_ENDPOINTS.invoices, {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal tambah')
        const data = await res.json()
        let created = data.data || data
        // Ensure clientName and projectName are populated from lookup
        const client = clients.find((c) => c.id === created.clientId)
        const project = collaborations.find((p) => p.id === created.projectId)
        created = {
          ...created,
          clientName: created.clientName || client?.name_brand || client?.brandName || client?.name || '',
          projectName: created.projectName || project?.projectName || project?.title || '',
        }
        setInvoices([...invoices, created])
      }
      setShowForm(false)
      setForm({ ...emptyForm, invoiceNumber: generateInvoiceNumber() })
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
      const res = await apiCall(`${API_ENDPOINTS.invoices}/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal hapus')
      setInvoices(invoices.filter((inv) => inv.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert('Gagal menghapus data. Coba lagi.')
      console.error(err)
    }
  }

  function downloadInvoice(invoice: Invoice) {
    const content = `
INVOICE
================================
Invoice Number: ${invoice.invoiceNumber}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString('id-ID')}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}

BILL TO:
${invoice.clientName}

PROJECT:
${invoice.projectName}

DESCRIPTION:
${invoice.description}

AMOUNT:
Rp ${invoice.amount.toLocaleString('id-ID')}

STATUS: ${invoice.status.toUpperCase()}

================================
Generated: ${new Date().toLocaleString('id-ID')}
    `
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', `${invoice.invoiceNumber}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  }

  const statusLabels = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
  }

  const filteredInvoices = invoices.filter((inv) =>
    inv.invoiceNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    inv.projectName.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Invoice</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Buat Invoice
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInvoices} className="text-red-700 font-medium hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Cari invoice, client, atau project..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Total Invoice</p>
          <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === 'paid').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{invoices.filter(i => i.status === 'sent').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="text-lg font-bold text-gray-800">Rp {invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Invoice #</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Client</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Project</th>
              <th className="px-5 py-3 text-right text-gray-600 font-medium">Amount</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Due Date</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Status</th>
              <th className="px-5 py-3 text-left text-gray-600 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">

            {/* Loading */}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}

            {/* Empty */}
            {!isLoading && filteredInvoices.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  {invoices.length === 0 ? 'Belum ada invoice. Klik "+ Buat Invoice" untuk membuat.' : 'Tidak ada hasil pencarian.'}
                </td>
              </tr>
            )}

            {/* Data */}
            {!isLoading && filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-800 font-medium">{invoice.invoiceNumber}</td>
                <td className="px-5 py-3 text-gray-500">{invoice.clientName}</td>
                <td className="px-5 py-3 text-gray-500">{invoice.projectName ?? '-'}</td>
                <td className="px-5 py-3 text-gray-800 font-medium text-right">Rp {invoice.amount.toLocaleString('id-ID')}</td>
                <td className="px-5 py-3 text-gray-500">{new Date(invoice.dueDate).toLocaleDateString('id-ID')}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {statusLabels[invoice.status] ?? invoice.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadInvoice(invoice)}
                      className="text-xs px-3 py-1 rounded-md border border-green-300 text-green-600 hover:bg-green-50"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => openEdit(invoice)}
                      className="text-xs px-3 py-1 rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(invoice.id)}
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
              {editId ? 'Edit Invoice' : 'Buat Invoice Baru'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Invoice Number *</label>
                  <input
                    name="invoiceNumber"
                    value={form.invoiceNumber}
                    onChange={handleChange}
                    placeholder="Auto generated"
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Issue Date</label>
                  <input
                    type="date"
                    name="issueDate"
                    value={form.issueDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
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
                    {clients.length === 0 ? (
                      <option disabled>Tidak ada client</option>
                    ) : (
                      clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name_brand || client.brandName || client.name || `Client ${client.id}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Project</label>
                <select
                  value={form.projectId}
                  onChange={handleProjectChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value={0}>Pilih project (optional)</option>
                  {collaborations.length === 0 ? (
                    <option disabled>Tidak ada project</option>
                  ) : (
                    collaborations.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.projectName || project.title || `Project ${project.id}`} 
                        {form.clientId > 0 && project.clientId === form.clientId ? ' (matching client)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Amount (Rp)</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0"
                    min={0}
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
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Deskripsi</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detail invoice..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
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
                {isSaving ? 'Menyimpan...' : editId ? 'Simpan' : 'Buat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Hapus Invoice?</h2>
            <p className="text-sm text-gray-500">
              Invoice <span className="font-medium text-gray-700">
                {invoices.find((inv) => inv.id === deleteId)?.invoiceNumber ?? 'ini'}
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
