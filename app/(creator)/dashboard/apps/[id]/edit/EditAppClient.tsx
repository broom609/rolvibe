'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { CATEGORIES, BUILT_WITH_OPTIONS } from '@/types'
import type { App } from '@/types'

export function EditAppClient({ app }: { app: App }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: app.name,
    tagline: app.tagline,
    description: app.description || '',
    category: app.category,
    built_with: app.built_with || '',
    app_url: app.app_url,
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/apps/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('App updated!')
      router.push('/dashboard/apps')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Update failed')
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this app? It will be hidden from the feed.')) return
    const res = await fetch(`/api/apps/${app.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('App archived.')
      router.push('/dashboard/apps')
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-[#1A1A1E] border border-[#2A2A30] rounded-2xl p-6 space-y-4">
      {[
        { name: 'name', label: 'App Name', type: 'input' },
        { name: 'tagline', label: 'Tagline', type: 'input' },
        { name: 'app_url', label: 'App URL', type: 'input' },
      ].map(({ name, label }) => (
        <div key={name}>
          <label className="text-sm font-medium text-[#A1A1AA] block mb-1.5">{label}</label>
          <input
            value={form[name as keyof typeof form] as string}
            onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
            className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2.5 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#6B21E8]"
          />
        </div>
      ))}
      <div>
        <label className="text-sm font-medium text-[#A1A1AA] block mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2.5 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#6B21E8] resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-[#A1A1AA] block mb-1.5">Category</label>
          <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2.5 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#6B21E8]">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-[#A1A1AA] block mb-1.5">Built With</label>
          <select value={form.built_with} onChange={e => setForm(prev => ({ ...prev, built_with: e.target.value }))}
            className="w-full bg-[#0E0E10] border border-[#2A2A30] rounded-lg px-3 py-2.5 text-sm text-[#F4F4F5] focus:outline-none focus:border-[#6B21E8]">
            {BUILT_WITH_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm flex-1 justify-center">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
        <button type="button" onClick={handleArchive} className="px-4 py-2 text-sm text-red-400 border border-red-900/40 hover:bg-red-900/20 rounded-lg transition-colors">
          Archive
        </button>
      </div>
    </form>
  )
}
