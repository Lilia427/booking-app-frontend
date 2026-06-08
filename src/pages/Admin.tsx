import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '../style/datepicker.css'

type Tab = 'reservations' | 'cottages'

const COTTAGES_API_URL = 'https://api.runabooking.me/api/cottages'

interface Cottage {
  id: number
  name: string
  description: string
  pricePerNight: number
  maxGuests: number
  imageKeys: string[]
  imageUrls: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Reservation {
  id: number
  name: string
  phone: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  roomType: string | number
  roomName?: string
  status: string
}

const normalizeCottage = (cottage: Partial<Cottage>): Cottage => ({
  id: Number(cottage.id ?? 0),
  name: String(cottage.name ?? ''),
  description: String(cottage.description ?? ''),
  pricePerNight: Number(cottage.pricePerNight ?? 0),
  maxGuests: Number(cottage.maxGuests ?? 0),
  imageKeys: Array.isArray(cottage.imageKeys) ? cottage.imageKeys : [],
  imageUrls: Array.isArray(cottage.imageUrls)
    ? cottage.imageUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
    : [],
  isActive: Boolean(cottage.isActive),
  createdAt: String(cottage.createdAt ?? ''),
  updatedAt: String(cottage.updatedAt ?? ''),
})

const Admin: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('reservations')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Reservation>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [cottages, setCottages] = useState<Cottage[]>([])
  const [cottagesLoading, setCottagesLoading] = useState(false)
  const [cottagesError, setCottagesError] = useState('')
  const [editingCottageId, setEditingCottageId] = useState<number | null>(null)
  const [cottageForm, setCottageForm] = useState<Partial<Cottage>>({})
  const [cottageFiles, setCottageFiles] = useState<File[]>([])
  const [cottageFilePreviews, setCottageFilePreviews] = useState<string[]>([])
  const [removeImageKeys, setRemoveImageKeys] = useState<string[]>([])
  const [savingCottage, setSavingCottage] = useState(false)
  const [isCreateCottageOpen, setIsCreateCottageOpen] = useState(false)
  const [newCottageForm, setNewCottageForm] = useState<Partial<Cottage>>({
    name: '',
    description: '',
    pricePerNight: 0,
    maxGuests: 1,
    isActive: true,
  })
  const [newCottageFiles, setNewCottageFiles] = useState<File[]>([])
  const [newCottageFilePreviews, setNewCottageFilePreviews] = useState<string[]>([])
  const [creatingCottage, setCreatingCottage] = useState(false)
  const [deletingCottageId, setDeletingCottageId] = useState<number | null>(null)

  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    if (!token) {
      navigate('/admin-login')
      return
    }

    const fetchReservations = async () => {
      try {
        const response = await fetch('https://api.runabooking.me/api/reservation', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          localStorage.removeItem('admin_token')
          navigate('/admin-login')
          return
        }

        const data = await response.json().catch(() => null)
        setReservations(data ?? [])
      } catch {
        setError('Failed to load reservations.')
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [token, navigate])

  const fetchCottages = async () => {
    setCottagesLoading(true)
    setCottagesError('')
    try {
      const response = await fetch(COTTAGES_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => null)
      const cottagesList = Array.isArray(data) ? data : data?.data
      setCottages(Array.isArray(cottagesList) ? cottagesList.map(normalizeCottage) : [])
    } catch {
      setCottagesError('Failed to load cottages.')
    } finally {
      setCottagesLoading(false)
    }
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'cottages' && cottages.length === 0 && !cottagesLoading) {
      fetchCottages()
    }
  }

  const openEditCottage = (c: Cottage) => {
    setEditingCottageId(c.id)
    setCottageForm({ ...c })
    setCottageFiles([])
    setCottageFilePreviews([])
    setRemoveImageKeys([])
  }

  useEffect(() => {
    if (cottageFiles.length === 0) {
      setCottageFilePreviews([])
      return
    }

    const previews = cottageFiles.map((file) => URL.createObjectURL(file))
    setCottageFilePreviews(previews)

    return () => {
      previews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }
  }, [cottageFiles])

  useEffect(() => {
    if (newCottageFiles.length === 0) {
      setNewCottageFilePreviews([])
      return
    }

    const previews = newCottageFiles.map((file) => URL.createObjectURL(file))
    setNewCottageFilePreviews(previews)

    return () => {
      previews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }
  }, [newCottageFiles])

  const openCreateCottage = () => {
    setNewCottageForm({
      name: '',
      description: '',
      pricePerNight: 0,
      maxGuests: 1,
      isActive: true,
    })
    setNewCottageFiles([])
    setNewCottageFilePreviews([])
    setIsCreateCottageOpen(true)
  }

  const removeNewSelectedFile = (indexToRemove: number) => {
    setNewCottageFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const toS3KeyFromUrl = (url: string) => {
    const amazonMarker = 'amazonaws.com/'
    const markerIndex = url.indexOf(amazonMarker)
    if (markerIndex >= 0) {
      return url.slice(markerIndex + amazonMarker.length)
    }

    try {
      const parsed = new URL(url)
      return parsed.pathname.replace(/^\/+/, '')
    } catch {
      return ''
    }
  }

  const removeExistingImage = (indexToRemove: number) => {
    const keyFromArray = cottageForm.imageKeys?.[indexToRemove]
    const keyFromUrl = toS3KeyFromUrl(cottageForm.imageUrls?.[indexToRemove] ?? '')
    const keyToRemove = keyFromArray || keyFromUrl

    if (keyToRemove) {
      setRemoveImageKeys((prev) => (prev.includes(keyToRemove) ? prev : [...prev, keyToRemove]))
    }

    setCottageForm((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls ?? []).filter((_, index) => index !== indexToRemove),
      imageKeys: (prev.imageKeys ?? []).filter((_, index) => index !== indexToRemove),
    }))
  }

  const removeSelectedFile = (indexToRemove: number) => {
    setCottageFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleCottageSave = async () => {
    if (editingCottageId === null) return
    setSavingCottage(true)
    try {
      const hasFiles = cottageFiles.length > 0
      const payload = hasFiles
        ? (() => {
            const formData = new FormData()
            if (cottageForm.name !== undefined) formData.append('name', String(cottageForm.name))
            if (cottageForm.description !== undefined) {
              formData.append('description', String(cottageForm.description))
            }
            if (cottageForm.pricePerNight !== undefined) {
              formData.append('pricePerNight', String(cottageForm.pricePerNight))
            }
            if (cottageForm.maxGuests !== undefined) {
              formData.append('maxGuests', String(cottageForm.maxGuests))
            }
            if (cottageForm.isActive !== undefined) {
              formData.append('isActive', String(cottageForm.isActive))
            }
            if (Array.isArray(cottageForm.imageUrls)) {
              formData.append('imageUrls', JSON.stringify(cottageForm.imageUrls))
            }
            removeImageKeys.forEach((key) => formData.append('removeImageKeys', key))
            cottageFiles.forEach((file) => formData.append('images', file))
            return formData
          })()
        : JSON.stringify({
            ...cottageForm,
            removeImageKeys,
          })

      const response = await fetch(`${COTTAGES_API_URL}/${editingCottageId}`, {
        method: 'PATCH',
        headers: {
          ...(hasFiles ? {} : { 'Content-Type': 'application/json' }),
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      })
      const updated = await response.json().catch(() => null)
      const updatedEntity = updated?.data ?? updated
      setCottages((prev) =>
        prev.map((c) =>
          c.id === editingCottageId
            ? normalizeCottage({ ...c, ...cottageForm, ...(updatedEntity ?? {}) })
            : c
        )
      )
      setEditingCottageId(null)
      setCottageFiles([])
      setCottageFilePreviews([])
      setRemoveImageKeys([])
    } catch {
      alert('Failed to save cottage.')
    } finally {
      setSavingCottage(false)
    }
  }

  const handleCreateCottage = async () => {
    if (!newCottageForm.name || !newCottageForm.description) {
      alert('Name and description are required.')
      return
    }

    setCreatingCottage(true)
    try {
      const formData = new FormData()
      formData.append('name', String(newCottageForm.name))
      formData.append('description', String(newCottageForm.description))
      formData.append('pricePerNight', String(newCottageForm.pricePerNight ?? 0))
      formData.append('maxGuests', String(newCottageForm.maxGuests ?? 1))
      formData.append('isActive', String(newCottageForm.isActive ?? true))
      newCottageFiles.forEach((file) => formData.append('images', file))

      const response = await fetch(COTTAGES_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Create failed (${response.status})`)
      }

      const created = await response.json().catch(() => null)
      const createdEntity = normalizeCottage(created?.data ?? created ?? {})
      setCottages((prev) => [createdEntity, ...prev])
      setIsCreateCottageOpen(false)
      setNewCottageFiles([])
      setNewCottageFilePreviews([])
    } catch {
      alert('Failed to create cottage.')
    } finally {
      setCreatingCottage(false)
    }
  }

  const handleDeleteCottage = async (id: number) => {
    if (!confirm('Delete this cottage?')) return
    setDeletingCottageId(id)
    try {
      const response = await fetch(`${COTTAGES_API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Delete failed (${response.status})`)
      }

      setCottages((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert('Failed to delete cottage.')
    } finally {
      setDeletingCottageId(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('https://api.runabooking.me/api/admin/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
    } finally {
      localStorage.removeItem('admin_token')
      navigate('/')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this reservation?')) return
    setDeletingId(id)
    try {
      await fetch(`https://api.runabooking.me/api/reservation/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setReservations((prev) => prev.filter((r) => r.id !== id))
    } catch {
      alert('Failed to delete.')
    } finally {
      setDeletingId(null)
    }
  }

  const parseDateValue = (val: string | undefined): Date | null => {
    if (!val) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [year, month, day] = val.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const parsed = new Date(val)
    if (Number.isNaN(parsed.getTime())) return null
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  }

  const formatDateForApi = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const toDateInput = (val: string | undefined) => {
    const parsed = parseDateValue(val)
    if (!parsed) return ''
    return formatDateForApi(parsed)
  }

  const formatDateDisplay = (val: string | undefined) => {
    const parsed = parseDateValue(val)
    if (!parsed) return val || '-'

    const day = String(parsed.getDate()).padStart(2, '0')
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const year = parsed.getFullYear()
    return `${day}/${month}/${year}`
  }

  const toDateTime = (val: string | undefined) => {
    if (!val) return '-'
    const parsed = new Date(val)
    if (Number.isNaN(parsed.getTime())) return val

    return parsed.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const openEdit = (r: Reservation) => {
    setEditingId(r.id)
    setEditForm({
      ...r,
      checkIn: toDateInput(r.checkIn),
      checkOut: toDateInput(r.checkOut),
    })
  }

  const handleEditSave = async () => {
    if (editingId === null) return
    setSaving(true)
    try {
      const response = await fetch(`https://api.runabooking.me/api/reservation/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })
      const updated = await response.json().catch(() => null)
      setReservations((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...updated } : r))
      )
      setEditingId(null)
    } catch {
      alert('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const statusStyle: Record<string, string> = {
    booked: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    cancelled: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  }

  const columns = ['#', 'Guest', 'Phone', 'Check In', 'Check Out', 'Guests', 'Room', 'Status', 'Actions']

  return (
    <section className='flex flex-col h-screen bg-slate-900 overflow-hidden'>

      <div className='shrink-0 bg-slate-950 border-b border-slate-700/60 px-8 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='h-8 w-1 rounded-full bg-accent' />
          <h1 className='text-white text-xl font-bold tracking-wide'>Booking Admin</h1>
        </div>
        <button
          onClick={handleLogout}
          className='flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20'
        >
          Logout
        </button>
      </div>

      <div className='shrink-0 bg-slate-900 border-b border-slate-700/60 px-8 flex gap-1'>
        {(['reservations', 'cottages'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-5 py-3 text-sm font-semibold capitalize transition border-b-2 ${
              activeTab === tab
                ? 'border-accent text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'reservations' ? 'Reservations' : 'Cottages'}
          </button>
        ))}
      </div>

      <div className='flex flex-1 flex-col overflow-hidden px-8 py-6'>

        {activeTab === 'reservations' && (<>
        <div className='mb-5 shrink-0 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Reservations</h2>
            {!loading && (
              <p className='mt-1 text-sm text-slate-400'>
                {reservations.length} record{reservations.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className='flex flex-1 items-center justify-center gap-3'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-slate-200' />
            <p className='text-slate-400'>Loading reservations...</p>
          </div>
        )}

        {error && (
          <div className='rounded-xl border border-red-700 bg-red-900/30 px-6 py-4 text-sm text-red-400'>
            {error}
          </div>
        )}

        {!loading && !error && reservations.length === 0 && (
          <div className='flex flex-1 items-center justify-center'>
            <p className='text-slate-500 text-lg'>No reservations yet.</p>
          </div>
        )}

        {!loading && reservations.length > 0 && (
          <div className='flex-1 overflow-auto rounded-2xl ring-1 ring-slate-700 shadow-2xl'>
            <table className='min-w-full divide-y divide-slate-700/50 text-xl'>

              <thead className='sticky top-0 z-10'>
                <tr className='bg-slate-800 text-left text-lg font-semibold uppercase tracking-widest text-slate-400'>
                  {columns.map((col) => (
                    <th key={col} className='px-6 py-4 whitespace-nowrap'>{col}</th>
                  ))}
                </tr>
              </thead>

              <tbody className='divide-y divide-slate-700/40'>
                {reservations.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-slate-700/40 ${idx % 2 === 0 ? 'bg-slate-800/60' : 'bg-slate-800/30'}`}
                  >
                    <td className='px-6 py-4 text-slate-500 font-mono text-lg'>{r.id}</td>

                    <td className='px-6 py-4'>
                      <div className='font-semibold text-white'>{r.name}</div>
                    </td>

                    <td className='px-6 py-4 text-slate-300'>{r.phone}</td>

                    <td className='px-6 py-4'>
                      <span className='inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-lg font-medium text-slate-200'>
                        📅 {formatDateDisplay(r.checkIn)}
                      </span>
                    </td>

                    <td className='px-6 py-4'>
                      <span className='inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-lg font-medium text-slate-200'>
                        📅 {formatDateDisplay(r.checkOut)}
                      </span>
                    </td>

                    <td className='px-6 py-4 text-slate-300'>
                      <span title='Adults'>👤 {r.adults}</span>
                      {r.children > 0 && (
                        <span className='ml-2' title='Children'>🧒 {r.children}</span>
                      )}
                    </td>

                    <td className='px-6 py-4 text-slate-200 font-medium'>
                      {r.roomName || `Room ${r.roomType}`}
                    </td>

                    <td className='px-6 py-4'>
                      <span className={`rounded-full px-3 py-1 text-lg font-semibold capitalize ${statusStyle[r.status] ?? 'bg-slate-700 text-slate-300'}`}>
                        {r.status}
                      </span>
                    </td>

                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => openEdit(r)}
                          className='rounded-lg bg-blue-600/20 px-3 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-blue-500/40 transition hover:bg-blue-600/40'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className='rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 ring-1 ring-red-500/40 transition hover:bg-red-600/40 disabled:opacity-50'
                        >
                          {deletingId === r.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        </>)}

        {activeTab === 'cottages' && (
          <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='mb-5 shrink-0 flex items-center justify-between'>
              <div>
                <h2 className='text-2xl font-bold text-white'>Cottages</h2>
                <p className='mt-1 text-sm text-slate-400'>Create, edit and delete cottages</p>
              </div>
              <button
                onClick={openCreateCottage}
                className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
              >
                + Add Cottage
              </button>
            </div>

            {cottagesLoading && (
              <div className='flex flex-1 items-center justify-center gap-3'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-slate-200' />
                <p className='text-slate-400'>Loading cottages...</p>
              </div>
            )}

            {cottagesError && (
              <div className='rounded-xl border border-red-700 bg-red-900/30 px-6 py-4 text-sm text-red-400'>
                {cottagesError}
              </div>
            )}

            {!cottagesLoading && !cottagesError && cottages.length === 0 && (
              <div className='flex flex-1 items-center justify-center'>
                <p className='text-slate-500 text-lg'>No cottages found.</p>
              </div>
            )}

            {!cottagesLoading && cottages.length > 0 && (
              <div className='flex-1 overflow-auto rounded-2xl ring-1 ring-slate-700 shadow-2xl'>
                <table className='min-w-full divide-y divide-slate-700/50 text-xl'>
                  <thead className='sticky top-0 z-10'>
                    <tr className='bg-slate-800 text-left text-lg font-semibold uppercase tracking-widest text-slate-400'>
                      {['#', 'Name', 'Description', 'Price / night', 'Max Guests', 'Images', 'Status', 'Created', 'Updated', 'Actions'].map((col) => (
                        <th key={col} className='px-6 py-4 whitespace-nowrap'>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-700/40'>
                    {cottages.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={`transition-colors hover:bg-slate-700/40 ${idx % 2 === 0 ? 'bg-slate-800/60' : 'bg-slate-800/30'}`}
                      >
                        <td className='px-6 py-4 text-slate-500 font-mono text-lg'>{c.id}</td>
                        <td className='px-6 py-4 font-semibold text-white whitespace-nowrap'>{c.name}</td>
                        <td className='px-6 py-4 text-slate-300 max-w-sm truncate'>{c.description}</td>
                        <td className='px-6 py-4 text-slate-200'>{c.pricePerNight} ₴</td>
                        <td className='px-6 py-4 text-slate-200'>{c.maxGuests}</td>
                        <td className='px-6 py-4'>
                          {c.imageUrls.length > 0 ? (
                            <div className='flex items-center gap-2'>
                              <img
                                src={c.imageUrls[0]}
                                alt='Cottage image'
                                className='h-10 w-14 rounded object-cover ring-1 ring-slate-600'
                                loading='lazy'
                              />
                              <span className='text-slate-200'>{c.imageUrls.length}</span>
                            </div>
                          ) : (
                            <span className='text-slate-400'>0</span>
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              c.isActive
                                ? 'bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40'
                                : 'bg-slate-600/30 text-slate-300 ring-1 ring-slate-500/40'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-slate-300 whitespace-nowrap'>{toDateTime(c.createdAt)}</td>
                        <td className='px-6 py-4 text-slate-300 whitespace-nowrap'>{toDateTime(c.updatedAt)}</td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() => openEditCottage(c)}
                              className='rounded-lg bg-blue-600/20 px-3 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-blue-500/40 transition hover:bg-blue-600/40'
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCottage(c.id)}
                              disabled={deletingCottageId === c.id}
                              className='rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 ring-1 ring-red-500/40 transition hover:bg-red-600/40 disabled:opacity-50'
                            >
                              {deletingCottageId === c.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {editingId !== null && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
          <div className='w-full max-w-lg rounded-2xl bg-slate-800 p-8 shadow-2xl ring-1 ring-slate-700'>
            <h3 className='mb-6 text-xl font-bold text-white'>Edit Reservation #{editingId}</h3>

            <div className='grid grid-cols-2 gap-4'>
              {(
                [
                  { label: 'Name', key: 'name', type: 'text' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                  { label: 'Adults', key: 'adults', type: 'number' },
                  { label: 'Children', key: 'children', type: 'number' },
                  { label: 'Room Name', key: 'roomName', type: 'text' },
                  { label: 'Room Type', key: 'roomType', type: 'text' },
                ] as { label: string; key: keyof Reservation; type: string }[]
              ).map(({ label, key, type }) => (
                <label key={key} className='flex flex-col gap-1'>
                  <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>{label}</span>
                  <input
                    type={type}
                    value={String(editForm[key] ?? '')}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                  />
                </label>
              ))}

              <label className='flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Check In</span>
                <DatePicker
                  selected={parseDateValue(editForm.checkIn)}
                  onChange={(date) =>
                    setEditForm((prev) => ({
                      ...prev,
                      checkIn: date ? formatDateForApi(date) : '',
                    }))
                  }
                  dateFormat='dd/MM/yyyy'
                  placeholderText='дд/мм/рррр'
                  className='w-full rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                />
              </label>

              <label className='flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Check Out</span>
                <DatePicker
                  selected={parseDateValue(editForm.checkOut)}
                  onChange={(date) =>
                    setEditForm((prev) => ({
                      ...prev,
                      checkOut: date ? formatDateForApi(date) : '',
                    }))
                  }
                  dateFormat='dd/MM/yyyy'
                  placeholderText='дд/мм/рррр'
                  className='w-full rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                />
              </label>

              <label className='flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Status</span>
                <select
                  value={String(editForm.status ?? '')}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                >
                  <option value='booked'>Booked</option>
                  <option value='pending'>Pending</option>
                  <option value='cancelled'>Cancelled</option>
                </select>
              </label>
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => setEditingId(null)}
                className='rounded-lg px-5 py-2 text-sm font-medium text-slate-400 ring-1 ring-slate-600 transition hover:bg-slate-700'
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className='rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60'
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCottageId !== null && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
          <div className='w-full max-w-lg rounded-2xl bg-slate-800 p-8 shadow-2xl ring-1 ring-slate-700'>
            <h3 className='mb-6 text-xl font-bold text-white'>Edit Cottage #{editingCottageId}</h3>

            <div className='grid grid-cols-2 gap-4'>
              {(
                [
                  { label: 'Name', key: 'name', type: 'text' },
                  { label: 'Price (₴)', key: 'pricePerNight', type: 'number' },
                  { label: 'Max Guests', key: 'maxGuests', type: 'number' },
                ] as { label: string; key: keyof Cottage; type: string }[]
              ).map(({ label, key, type }) => (
                <label key={key} className='flex flex-col gap-1'>
                  <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>{label}</span>
                  <input
                    type={type}
                    value={String(cottageForm[key] ?? '')}
                    onChange={(e) =>
                      setCottageForm((prev) => ({
                        ...prev,
                        [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                  />
                </label>
              ))}

              <label className='flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Status</span>
                <select
                  value={cottageForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setCottageForm((prev) => ({
                      ...prev,
                      isActive: e.target.value === 'active',
                    }))
                  }
                  className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                >
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </select>
              </label>

              <label className='col-span-2 flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Description</span>
                <textarea
                  rows={4}
                  value={String(cottageForm.description ?? '')}
                  onChange={(e) => setCottageForm((prev) => ({ ...prev, description: e.target.value }))}
                  className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500 resize-none'
                />
              </label>

              <label className='col-span-2 flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Upload Images</span>
                <input
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={(e) => setCottageFiles(Array.from(e.target.files ?? []))}
                  className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-600 file:px-3 file:py-1.5 file:text-white focus:ring-blue-500'
                />
                <p className='text-xs text-slate-400'>Current images: {cottageForm.imageUrls?.length ?? 0}</p>
                {cottageFiles.length > 0 && (
                  <p className='text-xs text-emerald-300'>Selected files: {cottageFiles.length}</p>
                )}

                {Array.isArray(cottageForm.imageUrls) && cottageForm.imageUrls.length > 0 && (
                  <div className='mt-2'>
                    <p className='mb-2 text-xs text-slate-400'>Current images preview</p>
                    <div className='grid grid-cols-3 gap-2'>
                      {cottageForm.imageUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className='relative'>
                          <img
                            src={url}
                            alt={`Current cottage image ${index + 1}`}
                            className='h-20 w-full rounded-md object-cover ring-1 ring-slate-600'
                            loading='lazy'
                          />
                          <button
                            type='button'
                            onClick={() => removeExistingImage(index)}
                            className='absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-xs font-bold text-white ring-1 ring-red-300 transition hover:bg-red-500'
                            aria-label='Remove current image'
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cottageFilePreviews.length > 0 && (
                  <div className='mt-2'>
                    <p className='mb-2 text-xs text-emerald-300'>New files preview (before save)</p>
                    <div className='grid grid-cols-3 gap-2'>
                      {cottageFilePreviews.map((previewUrl, index) => (
                        <div key={`${previewUrl}-${index}`} className='relative'>
                          <img
                            src={previewUrl}
                            alt={`Selected file ${index + 1}`}
                            className='h-20 w-full rounded-md object-cover ring-1 ring-emerald-500/40'
                          />
                          <button
                            type='button'
                            onClick={() => removeSelectedFile(index)}
                            className='absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-xs font-bold text-white ring-1 ring-red-300 transition hover:bg-red-500'
                            aria-label='Remove selected image'
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setEditingCottageId(null)
                  setCottageFiles([])
                  setCottageFilePreviews([])
                  setRemoveImageKeys([])
                }}
                className='rounded-lg px-5 py-2 text-sm font-medium text-slate-400 ring-1 ring-slate-600 transition hover:bg-slate-700'
              >
                Cancel
              </button>
              <button
                onClick={handleCottageSave}
                disabled={savingCottage}
                className='rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60'
              >
                {savingCottage ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateCottageOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
          <div className='w-full max-w-lg rounded-2xl bg-slate-800 p-8 shadow-2xl ring-1 ring-slate-700'>
            <h3 className='mb-6 text-xl font-bold text-white'>Create Cottage</h3>

            <div className='grid grid-cols-2 gap-4'>
              {(
                [
                  { label: 'Name', key: 'name', type: 'text' },
                  { label: 'Price (₴)', key: 'pricePerNight', type: 'number' },
                  { label: 'Max Guests', key: 'maxGuests', type: 'number' },
                ] as { label: string; key: keyof Cottage; type: string }[]
              ).map(({ label, key, type }) => (
                <label key={key} className='flex flex-col gap-1'>
                  <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>{label}</span>
                  <input
                    type={type}
                    value={String(newCottageForm[key] ?? '')}
                    onChange={(e) =>
                      setNewCottageForm((prev) => ({
                        ...prev,
                        [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                  />
                </label>
              ))}

              <label className='flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Status</span>
                <select
                  value={newCottageForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setNewCottageForm((prev) => ({
                      ...prev,
                      isActive: e.target.value === 'active',
                    }))
                  }
                  className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500'
                >
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </select>
              </label>

              <label className='col-span-2 flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Description</span>
                <textarea
                  rows={4}
                  value={String(newCottageForm.description ?? '')}
                  onChange={(e) => setNewCottageForm((prev) => ({ ...prev, description: e.target.value }))}
                  className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 focus:ring-blue-500 resize-none'
                />
              </label>

              <label className='col-span-2 flex flex-col gap-1'>
                <span className='text-xs font-medium uppercase tracking-wider text-slate-400'>Upload Images</span>
                <input
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={(e) => setNewCottageFiles(Array.from(e.target.files ?? []))}
                  className='rounded-lg bg-slate-700 px-3 py-2 text-white outline-none ring-1 ring-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-600 file:px-3 file:py-1.5 file:text-white focus:ring-blue-500'
                />
                {newCottageFiles.length > 0 && (
                  <p className='text-xs text-emerald-300'>Selected files: {newCottageFiles.length}</p>
                )}

                {newCottageFilePreviews.length > 0 && (
                  <div className='mt-2'>
                    <p className='mb-2 text-xs text-emerald-300'>New files preview</p>
                    <div className='grid grid-cols-3 gap-2'>
                      {newCottageFilePreviews.map((previewUrl, index) => (
                        <div key={`${previewUrl}-${index}`} className='relative'>
                          <img
                            src={previewUrl}
                            alt={`Selected file ${index + 1}`}
                            className='h-20 w-full rounded-md object-cover ring-1 ring-emerald-500/40'
                          />
                          <button
                            type='button'
                            onClick={() => removeNewSelectedFile(index)}
                            className='absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-xs font-bold text-white ring-1 ring-red-300 transition hover:bg-red-500'
                            aria-label='Remove selected image'
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setIsCreateCottageOpen(false)
                  setNewCottageFiles([])
                  setNewCottageFilePreviews([])
                }}
                className='rounded-lg px-5 py-2 text-sm font-medium text-slate-400 ring-1 ring-slate-600 transition hover:bg-slate-700'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCottage}
                disabled={creatingCottage}
                className='rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60'
              >
                {creatingCottage ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}

export default Admin
