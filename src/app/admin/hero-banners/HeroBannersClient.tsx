'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Monitor,
  Smartphone,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  X
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ConfirmModal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

export interface HeroBanner {
  id: string
  title: string
  alt_text: string
  desktop_image_url: string
  mobile_image_url: string
  link_url?: string
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function HeroBannersClient({ initialBanners }: { initialBanners: HeroBanner[] }) {
  const router = useRouter()
  const [banners, setBanners] = useState<HeroBanner[]>(initialBanners)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    alt_text: '',
    desktop_image_url: '',
    mobile_image_url: '',
    link_url: '',
    display_order: 1,
    is_active: true
  })

  // Uploading states
  const [uploadingDesktop, setUploadingDesktop] = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const desktopFileInputRef = useRef<HTMLInputElement>(null)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  // Fetch updated banners
  const fetchBanners = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/admin/hero-banners')
      const data = await res.json()
      if (data.success && data.banners) {
        setBanners(data.banners)
      }
    } catch (err) {
      console.error('Failed to fetch hero banners:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingBanner(null)
    setFormData({
      title: '',
      alt_text: '',
      desktop_image_url: '',
      mobile_image_url: '',
      link_url: '',
      display_order: banners.length + 1,
      is_active: true
    })
    setStatusMsg(null)
    setShowModal(true)
  }

  // Open modal for Edit
  const handleOpenEditModal = (banner: HeroBanner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title || '',
      alt_text: banner.alt_text || '',
      desktop_image_url: banner.desktop_image_url || '',
      mobile_image_url: banner.mobile_image_url || '',
      link_url: banner.link_url || '',
      display_order: banner.display_order || 1,
      is_active: banner.is_active
    })
    setStatusMsg(null)
    setShowModal(true)
  }

  // File Upload Handler
  const handleFileUpload = async (file: File, target: 'desktop' | 'mobile') => {
    const isDesktop = target === 'desktop'
    if (isDesktop) setUploadingDesktop(true)
    else setUploadingMobile(true)
    setStatusMsg(null)

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('target', target)

      const res = await fetch('/api/admin/hero-banners/upload', {
        method: 'POST',
        body
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Upload failed')
      }

      setFormData(prev => ({
        ...prev,
        [isDesktop ? 'desktop_image_url' : 'mobile_image_url']: data.url
      }))
      setStatusMsg({ type: 'success', text: `${isDesktop ? 'Desktop' : 'Mobile'} image uploaded successfully!` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      if (isDesktop) setUploadingDesktop(false)
      else setUploadingMobile(false)
    }
  }

  // Submit Handler (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.desktop_image_url || !formData.mobile_image_url) {
      setStatusMsg({ type: 'error', text: 'Both Desktop and Mobile images are required.' })
      return
    }

    setIsSubmitting(true)
    setStatusMsg(null)

    try {
      const method = editingBanner ? 'PUT' : 'POST'
      const payload = editingBanner
        ? { id: editingBanner.id, ...formData }
        : formData

      const res = await fetch('/api/admin/hero-banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save banner')
      }

      setStatusMsg({ type: 'success', text: `Banner ${editingBanner ? 'updated' : 'created'} successfully!` })
      setTimeout(() => {
        setShowModal(false)
        fetchBanners()
        router.refresh()
      }, 600)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving banner'
      setStatusMsg({ type: 'error', text: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteBannerId) return
    try {
      const res = await fetch(`/api/admin/hero-banners?id=${deleteBannerId}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete banner')
      }

      setDeleteBannerId(null)
      fetchBanners()
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting banner'
      alert(msg)
    }
  }

  // Quick Toggle Active Status
  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      const res = await fetch('/api/admin/hero-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: banner.id,
          is_active: !banner.is_active
        })
      })
      const data = await res.json()
      if (data.success) {
        fetchBanners()
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to toggle active status:', err)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <AdminHeader
        icon={ImageIcon}
        title="Hero Banners Management"
        description="Add, edit, and arrange hero slider banners for Desktop and Mobile devices"
        actionLabel="Add New Banner"
        onAction={handleOpenCreateModal}
      />

      {/* Top Banner Stats & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ImageIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Banners</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{banners.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Banners</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {banners.filter(b => b.is_active).length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Live Sync to Home</p>
            </div>
          </div>
          <button
            onClick={fetchBanners}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Banners"
          >
            <RefreshCw size={18} className={cn(isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Banner Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Slider Banners</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Ordered by Display Order</span>
        </div>

        {banners.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Hero Banners Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add your first hero banner to start customizing the home page header carousel.</p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add First Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={cn(
                  'rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md',
                  banner.is_active
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/10'
                )}
              >
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                  {/* Left: Info & Badge */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        Banner #{index + 1}
                      </span>
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors',
                          banner.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                        )}
                      >
                        {banner.is_active ? (
                          <>
                            <CheckCircle2 size={12} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Center: Image Previews (Desktop & Mobile side-by-side) */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Desktop Preview */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Monitor size={12} /> Desktop Image
                      </div>
                      <div className="w-48 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative group">
                        <img
                          src={banner.desktop_image_url}
                          alt={banner.alt_text || 'Desktop Banner'}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    </div>

                    {/* Mobile Preview */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Smartphone size={12} /> Mobile Image
                      </div>
                      <div className="w-20 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative group">
                        <img
                          src={banner.mobile_image_url || banner.desktop_image_url}
                          alt={banner.alt_text || 'Mobile Banner'}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEditModal(banner)}
                      className="px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteBannerId(banner.id)}
                      className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================
          CREATE / EDIT BANNER MODAL
      ========================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingBanner ? 'Edit Hero Banner Images' : 'Add New Hero Banner Images'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload separate high-resolution images for Desktop & Mobile views.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {statusMsg && (
                <div
                  className={cn(
                    'p-3.5 rounded-xl text-xs font-medium flex items-center gap-2',
                    statusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
                  )}
                >
                  {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {statusMsg.text}
                </div>
              )}

              {/* ── IMAGE UPLOADS SECTION ── */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Desktop Image Upload */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Monitor size={14} className="text-blue-600" />
                        Desktop Image <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Rec: 1920x800 px</span>
                    </div>

                    {formData.desktop_image_url ? (
                      <div className="relative h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 group">
                        <img
                          src={formData.desktop_image_url}
                          alt="Desktop preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => desktopFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-semibold hover:bg-white transition-colors"
                          >
                            Change Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => desktopFileInputRef.current?.click()}
                        className="h-36 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center"
                      >
                        <Upload size={28} className="text-slate-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {uploadingDesktop ? 'Uploading Desktop Image...' : 'Click to Upload Desktop Image'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB</span>
                      </div>
                    )}

                    <input
                      ref={desktopFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'desktop')
                      }}
                    />
                  </div>

                  {/* Mobile Image Upload */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Smartphone size={14} className="text-purple-600" />
                        Mobile Image <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Rec: 800x1200 px</span>
                    </div>

                    {formData.mobile_image_url ? (
                      <div className="relative h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 group">
                        <img
                          src={formData.mobile_image_url}
                          alt="Mobile preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => mobileFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-semibold hover:bg-white transition-colors"
                          >
                            Change Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => mobileFileInputRef.current?.click()}
                        className="h-36 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center"
                      >
                        <Upload size={28} className="text-slate-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {uploadingMobile ? 'Uploading Mobile Image...' : 'Click to Upload Mobile Image'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB</span>
                      </div>
                    )}

                    <input
                      ref={mobileFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'mobile')
                      }}
                    />
                  </div>

                </div>
              </div>

              {/* Status Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <label htmlFor="is_active_checkbox" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Active (Visible on public website carousel)
                </label>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingDesktop || uploadingMobile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> {editingBanner ? 'Save Changes' : 'Create Banner'}
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteBannerId)}
        onOpenChange={(open) => { if (!open) setDeleteBannerId(null) }}
        onConfirm={handleDeleteConfirm}
        title="Delete Hero Banner"
        message="Are you sure you want to delete this hero banner? This action cannot be undone."
        confirmLabel="Delete Banner"
        danger={true}
      />
    </div>
  )
}
