'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, ChevronRight, ChevronLeft, Loader2, Check, Camera } from 'lucide-react'
import Image from 'next/image'
import { AppCard } from '@/components/feed/AppCard'
import { CATEGORIES, BUILT_WITH_OPTIONS } from '@/types'
import type { App } from '@/types'
import { track } from '@/lib/analytics'
import { createClient } from '@/lib/supabase/client'

const step1Schema = z.object({
  app_url: z.string().url('Must be a valid HTTPS URL').startsWith('https://', 'URL must start with https://'),
})

const step2Schema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(60, 'Max 60 characters'),
  tagline: z.string().min(10, 'At least 10 characters').max(120, 'Max 120 characters'),
  description: z.string().max(2000, 'Max 2000 characters').optional(),
  category: z.string().min(1, 'Select a category'),
  built_with: z.string().min(1, 'Select a tool'),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

type PricingType = 'free' | 'paid' | 'subscription' | 'coming_soon'

type FormData = {
  app_url: string
  name: string
  tagline: string
  description?: string
  category: string
  built_with: string
  tags: string[]
  pricing_type: PricingType
  price_dollars: string
  subscription_price_dollars: string
  external_payment_url: string
  is_nsfw: boolean
  thumbnail_url?: string
  screenshots: string[]
}

const STEPS = ['App URL', 'App Info', 'Pricing', 'Review & Submit']

const PRICING_OPTIONS: { value: PricingType; label: string; desc: string }[] = [
  { value: 'free', label: 'Free', desc: 'Anyone can try it' },
  { value: 'paid', label: 'Paid', desc: 'One-time payment' },
  { value: 'subscription', label: 'Subscription', desc: 'Monthly recurring' },
  { value: 'coming_soon', label: 'Coming Soon', desc: 'Not live yet' },
]

const ACCEPTED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ACCEPTED_THUMBNAIL_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

function isAcceptedThumbnail(file: File) {
  return ACCEPTED_THUMBNAIL_TYPES.includes(file.type) || ACCEPTED_THUMBNAIL_EXTENSIONS.includes(getFileExtension(file.name))
}

export function SubmitAppForm() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<Partial<FormData>>({
    pricing_type: 'free',
    price_dollars: '',
    subscription_price_dollars: '',
    external_payment_url: '',
    tags: [],
    screenshots: [],
    is_nsfw: false,
  })

  const { register: reg1, handleSubmit: hs1, formState: { errors: e1 } } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const { register: reg2, handleSubmit: hs2, formState: { errors: e2 } } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (isMounted) setCurrentUserId(user?.id ?? null)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setCurrentUserId(session?.user?.id ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  function onStep1(data: Step1Data) {
    setFormData(prev => ({ ...prev, app_url: data.app_url }))
    setStep(1)
  }

  function onStep2(data: Step2Data) {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(2)
  }

  function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault()
    const pt = formData.pricing_type || 'free'
    if (pt === 'paid') {
      const v = parseFloat(formData.price_dollars || '')
      if (isNaN(v) || v < 0.99) {
        toast.error('Enter a valid price (minimum $0.99)')
        return
      }
    }
    if (pt === 'subscription') {
      const v = parseFloat(formData.subscription_price_dollars || '')
      if (isNaN(v) || v < 0.99) {
        toast.error('Enter a valid monthly price (minimum $0.99)')
        return
      }
    }
    setStep(3)
  }

  async function handleFinalSubmit() {
    setSubmitting(true)
    try {
      const pt = formData.pricing_type || 'free'
      const price_cents = pt === 'paid' ? Math.round(parseFloat(formData.price_dollars || '0') * 100) : null
      const subscription_price_cents = pt === 'subscription' ? Math.round(parseFloat(formData.subscription_price_dollars || '0') * 100) : null

      const payload = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description || null,
        app_url: formData.app_url,
        category: formData.category,
        built_with: formData.built_with,
        tags: formData.tags || [],
        pricing_type: pt,
        price_cents,
        subscription_price_cents,
        external_payment_url: formData.external_payment_url?.trim() || null,
        is_nsfw: formData.is_nsfw || false,
        thumbnail_url: formData.thumbnail_url || null,
        screenshots: formData.screenshots || [],
      }

      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Submission failed')
      }
      track('app_submitted', { pricing_type: pt, built_with: formData.built_with })
      toast.success("App submitted! We'll review it within 24 hours.")
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !formData.tags?.includes(tag) && (formData.tags?.length || 0) < 5) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }))
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }))
  }

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAcceptedThumbnail(file)) {
      toast.error('Please upload a JPG, PNG, WebP, or GIF image')
      e.target.value = ''
      return
    }

    if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
      toast.error('Image must be under 5MB')
      e.target.value = ''
      return
    }

    setThumbnailUploading(true)
    try {
      const userId = currentUserId || (await supabase.auth.getUser()).data.user?.id || null
      if (!userId) {
        toast.error('Please sign in to upload a thumbnail')
        return
      }

      const filePath = `thumbnails/${userId}/${Date.now()}-${sanitizeFileName(file.name)}`
      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type || undefined,
          upsert: false,
        })

      if (error) {
        console.error('Thumbnail upload failed:', error)
        toast.error(error.message.includes('Bucket not found') ? 'Thumbnail bucket is missing in Supabase' : 'Upload failed: ' + error.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(filePath)
      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }))
      toast.success('Thumbnail uploaded')
    } finally {
      setThumbnailUploading(false)
      e.target.value = ''
    }
  }

  function handleThumbnailRemove() {
    setFormData(prev => ({ ...prev, thumbnail_url: '' }))
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
  }

  const pricingType = formData.pricing_type || 'free'

  const previewApp: App = {
    id: 'preview',
    creator_id: '',
    name: formData.name || 'App Name',
    slug: 'preview',
    tagline: formData.tagline || 'Your app tagline goes here',
    description: formData.description || null,
    app_url: formData.app_url || '',
    thumbnail_url: formData.thumbnail_url || null,
    screenshots: formData.screenshots || [],
    category: formData.category || 'AI Tools',
    tags: formData.tags || [],
    built_with: formData.built_with || null,
    pricing_type: pricingType,
    price_cents: formData.price_dollars ? Math.round(parseFloat(formData.price_dollars) * 100) : null,
    subscription_price_cents: formData.subscription_price_dollars ? Math.round(parseFloat(formData.subscription_price_dollars) * 100) : null,
    external_payment_url: formData.external_payment_url || null,
    stripe_product_id: null,
    stripe_price_id: null,
    status: 'pending',
    rejection_reason: null,
    is_featured: false,
    is_nsfw: formData.is_nsfw || false,
    health_status: 'unknown',
    last_health_check: null,
    try_count: 0,
    favorite_count: 0,
    score: 0,
    admin_notes: null,
    submitted_at: new Date().toISOString(),
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? 'bg-gradient-to-r from-[#FF2D9B] to-[#6B21E8] text-white' :
              i === step ? 'bg-[var(--card)] border-2 border-[#6B21E8] text-[var(--text-primary)]' :
              'bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)]'
            }`}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${i === step ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-[var(--muted-surface)] mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">

        {/* Step 1: URL */}
        {step === 0 && (
          <form onSubmit={hs1(onStep1)} className="space-y-4">
            <h2 className="font-semibold text-[var(--text-primary)] mb-1">Step 1 — Your App URL</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Enter the URL where your app lives.</p>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">App URL *</label>
              <input
                {...reg1('app_url')}
                placeholder="https://myapp.vercel.app"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
              />
              {e1.app_url && <p className="text-xs text-red-400 mt-1">{e1.app_url.message}</p>}
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary text-sm flex items-center gap-1.5">Next <ChevronRight size={14} /></button>
            </div>
          </form>
        )}

        {/* Step 2: Info */}
        {step === 1 && (
          <form onSubmit={hs2(onStep2)} className="space-y-4">
            <h2 className="font-semibold text-[var(--text-primary)] mb-1">Step 2 — App Info</h2>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">App Name *</label>
              <input
                {...reg2('name')}
                defaultValue={formData.name}
                placeholder="My Vibe App"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
              />
              {e2.name && <p className="text-xs text-red-400 mt-1">{e2.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Tagline *</label>
              <input
                {...reg2('tagline')}
                defaultValue={formData.tagline}
                placeholder="One sentence that sells your app"
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
              />
              {e2.tagline && <p className="text-xs text-red-400 mt-1">{e2.tagline.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Description (optional)</label>
              <textarea
                {...reg2('description')}
                defaultValue={formData.description}
                rows={4}
                placeholder="Tell people what your app does..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Category *</label>
                <select
                  {...reg2('category')}
                  defaultValue={formData.category || ''}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6B21E8]"
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {e2.category && <p className="text-xs text-red-400 mt-1">{e2.category.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Built With *</label>
                <select
                  {...reg2('built_with')}
                  defaultValue={formData.built_with || ''}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6B21E8]"
                >
                  <option value="">Select tool...</option>
                  {BUILT_WITH_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {e2.built_with && <p className="text-xs text-red-400 mt-1">{e2.built_with.message}</p>}
              </div>
            </div>
            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Tags (up to 5)</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Add tag..."
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
                />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-sm transition-colors">Add</button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-[var(--muted-surface)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-[var(--text-primary)]"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                Thumbnail <span className="text-[var(--text-muted)] font-normal">(optional)</span>
              </label>
              <div
                className="relative w-[200px] aspect-video rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[#6B21E8] transition-colors overflow-hidden cursor-pointer bg-[var(--muted-surface)] flex items-center justify-center"
                onClick={() => thumbnailInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    thumbnailInputRef.current?.click()
                  }
                }}
              >
                {thumbnailUploading ? (
                  <div className="text-center py-6">
                    <Loader2 size={24} className="animate-spin text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-muted)]">Uploading thumbnail...</p>
                  </div>
                ) : formData.thumbnail_url ? (
                  <>
                    <Image src={formData.thumbnail_url} alt="Thumbnail" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/35 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Camera size={24} className="text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-muted)]">Upload thumbnail</p>
                    <p className="text-xs text-[var(--text-muted)]">JPG, PNG, WebP, GIF</p>
                    <p className="text-xs text-[var(--text-muted)]">Max 5MB</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {formData.thumbnail_url ? 'Replace image' : 'Choose image'}
                </button>
                {formData.thumbnail_url && (
                  <button
                    type="button"
                    onClick={handleThumbnailRemove}
                    className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleThumbnailChange}
              />
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ChevronLeft size={14} /> Back</button>
              <button type="submit" className="btn-primary text-sm flex items-center gap-1.5">Next <ChevronRight size={14} /></button>
            </div>
          </form>
        )}

        {/* Step 3: Pricing — plain state, no RHF/Zod to avoid NaN validation issues */}
        {step === 2 && (
          <form onSubmit={handleStep3Submit} className="space-y-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-1">Step 3 — Pricing</h2>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Pricing Type</label>
              <div className="grid grid-cols-2 gap-2">
                {PRICING_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pricing_type: value }))}
                    className={`text-left border rounded-xl p-3 transition-colors ${
                      pricingType === value
                        ? 'border-[#6B21E8] bg-[#6B21E8]/10'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {pricingType === 'paid' && (
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Price (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.99"
                    placeholder="9.99"
                    value={formData.price_dollars || ''}
                    onChange={e => setFormData(prev => ({ ...prev, price_dollars: e.target.value }))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6B21E8]"
                  />
                </div>
              </div>
            )}

            {pricingType === 'subscription' && (
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Monthly Price (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.99"
                    placeholder="9.99"
                    value={formData.subscription_price_dollars || ''}
                    onChange={e => setFormData(prev => ({ ...prev, subscription_price_dollars: e.target.value }))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6B21E8]"
                  />
                </div>
              </div>
            )}

            {(pricingType === 'paid' || pricingType === 'subscription') && (
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                  Payment / Checkout URL <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://gumroad.com/l/your-app"
                  value={formData.external_payment_url || ''}
                  onChange={e => setFormData(prev => ({ ...prev, external_payment_url: e.target.value }))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#6B21E8]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Where users go to pay (Gumroad, Stripe checkout, etc.)</p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ChevronLeft size={14} /> Back</button>
              <button type="submit" className="btn-primary text-sm flex items-center gap-1.5">Review <ChevronRight size={14} /></button>
            </div>
          </form>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-semibold text-[var(--text-primary)]">Step 4 — Review &amp; Submit</h2>
            <p className="text-sm text-[var(--text-secondary)]">Here's how your app will look on Rolvibe:</p>
            <div className="max-w-[280px]">
              <AppCard app={previewApp} />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_nsfw || false}
                  onChange={e => setFormData(prev => ({ ...prev, is_nsfw: e.target.checked }))}
                  className="w-4 h-4 rounded border-[var(--border)] bg-[var(--input-bg)] accent-[#6B21E8]"
                />
                <span className="text-sm text-[var(--text-secondary)]">This app contains adult/NSFW content</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-[var(--border)] bg-[var(--input-bg)] accent-[#6B21E8]" />
                <span className="text-sm text-[var(--text-secondary)]">
                  I confirm this app is my own work and complies with{' '}
                  <a href="/guidelines" target="_blank" className="text-[var(--text-primary)] underline">Rolvibe's creator guidelines</a>.
                </span>
              </label>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ChevronLeft size={14} /> Back</button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="btn-primary text-sm"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit App'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
