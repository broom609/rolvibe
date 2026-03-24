'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Smartphone, Monitor, Loader2, ExternalLink } from 'lucide-react'

interface AppPreviewProps {
  appUrl: string
  appName: string
  appId: string
  onClose: () => void
}

export function AppPreview({ appUrl, appName, appId, onClose }: AppPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [mobileMode, setMobileMode] = useState(false)
  const openedAt = useRef(Date.now())

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      // Log session time
      const sessionSeconds = Math.round((Date.now() - openedAt.current) / 1000)
      fetch(`/api/apps/${appId}/try`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_seconds: sessionSeconds }),
      })
    }
  }, [appId, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-[#1A1A1E] border border-[#2A2A30] rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A30] bg-[#1A1A1E] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-medium text-[#A1A1AA] truncate max-w-xs">{appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMode(!mobileMode)}
              className={`p-1.5 rounded-lg transition-colors ${mobileMode ? 'bg-[#2A2A30] text-[#F4F4F5]' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
              title="Toggle mobile view"
            >
              {mobileMode ? <Monitor size={15} /> : <Smartphone size={15} />}
            </button>
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#71717A] hover:text-[#A1A1AA] transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={15} />
            </a>
            <button onClick={onClose} className="p-1.5 text-[#71717A] hover:text-[#F4F4F5] transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#0E0E10]">
          <div
            className="relative h-full transition-all duration-300"
            style={{ width: mobileMode ? '390px' : '100%', maxHeight: '100%' }}
          >
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0E0E10] z-10">
                <Loader2 className="animate-spin text-[#6B21E8]" size={32} />
              </div>
            )}

            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0E0E10]">
                <p className="text-[#A1A1AA] text-sm text-center max-w-xs">
                  This app needs to be opened directly.
                </p>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <ExternalLink size={14} /> Open in New Tab
                </a>
              </div>
            ) : (
              <iframe
                src={appUrl}
                sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-pointer-lock"
                referrerPolicy="no-referrer"
                loading="lazy"
                title={appName}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
