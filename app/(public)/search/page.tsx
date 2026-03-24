import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchClient } from './SearchClient'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Search — Rolvibe',
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#6B21E8]" size={32} /></div>}>
      <SearchClient />
    </Suspense>
  )
}
