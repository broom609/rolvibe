'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { App, Category, PricingType } from '@/types'
import { CATEGORIES, BUILT_WITH_OPTIONS } from '@/types'

export function EditAppClient({ initialApp }: { initialApp: App }) {
  const router = useRouter()
  const [app, setApp] = useState<App>(initialApp)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/apps/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: app.name.trim(),
        tagline: app.tagline.trim(),
        description: app.description?.trim() || null,
        app_url: app.app_url.trim(),
        category: app.category,
        built_with: app.built_with,
        pricing_type: app.pricing_type,
        price_cents: app.pricing_type === 'paid' ? app.price_cents : null,
        subscription_price_cents: app.pricing_type === 'subscription' ? app.subscription_price_cents : null,
        external_payment_url: app.external_payment_url?.trim() || null,
        thumbnail_url: app.thumbnail_url?.trim() || null,
        screenshots: app.screenshots.filter(Boolean),
        tags: app.tags.filter(Boolean),
        demo_video_url: app.demo_video_url?.trim() || null,
      }),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      toast.error(body.error || 'Could not save app')
      return
    }

    toast.success('App updated')
    router.refresh()
  }

  async function archive() {
    if (!confirm('Archive this app? It will be removed from the storefront.')) return
    setDeleting(true)
    const res = await fetch(`/api/apps/${app.id}`, { method: 'DELETE' })
    setDeleting(false)

    if (!res.ok) {
      toast.error('Could not archive app')
      return
    }

    toast.success('App archived')
    router.push('/dashboard/apps')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit App</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Update your listing, pricing, media, and launch links.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">App name</span>
            <input
              value={app.name}
              onChange={(e) => setApp((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">App URL</span>
            <input
              value={app.app_url}
              onChange={(e) => setApp((prev) => ({ ...prev, app_url: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </label>
        </div>

        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Tagline</span>
          <input
            value={app.tagline}
            onChange={(e) => setApp((prev) => ({ ...prev, tagline: e.target.value }))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Description</span>
          <textarea
            rows={5}
            value={app.description || ''}
            onChange={(e) => setApp((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Category</span>
            <select
              value={app.category}
              onChange={(e) => setApp((prev) => ({ ...prev, category: e.target.value as Category }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Built with</span>
            <select
              value={app.built_with || ''}
              onChange={(e) => setApp((prev) => ({ ...prev, built_with: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            >
              <option value="">Select tool</option>
              {BUILT_WITH_OPTIONS.map((tool) => (
                <option key={tool} value={tool}>
                  {tool}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Pricing type</span>
            <select
              value={app.pricing_type}
              onChange={(e) => setApp((prev) => ({ ...prev, pricing_type: e.target.value as PricingType }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="subscription">Subscription</option>
              <option value="invite_only">Invite only</option>
              <option value="coming_soon">Coming soon</option>
            </select>
          </label>

          {app.pricing_type === 'paid' && (
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Price (cents)</span>
              <input
                type="number"
                min="99"
                value={app.price_cents || 0}
                onChange={(e) => setApp((prev) => ({ ...prev, price_cents: Number(e.target.value) }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </label>
          )}

          {app.pricing_type === 'subscription' && (
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Monthly price (cents)</span>
              <input
                type="number"
                min="99"
                value={app.subscription_price_cents || 0}
                onChange={(e) => setApp((prev) => ({ ...prev, subscription_price_cents: Number(e.target.value) }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              />
            </label>
          )}
        </div>

        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Thumbnail URL</span>
          <input
            value={app.thumbnail_url || ''}
            onChange={(e) => setApp((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Screenshot URLs</span>
          <textarea
            rows={4}
            value={app.screenshots.join('\n')}
            onChange={(e) =>
              setApp((prev) => ({
                ...prev,
                screenshots: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean),
              }))
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Tags</span>
          <input
            value={app.tags.join(', ')}
            onChange={(e) =>
              setApp((prev) => ({
                ...prev,
                tags: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              }))
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={archive}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/15 transition-colors disabled:opacity-60"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Archive app
        </button>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary text-sm"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
