import { Metadata } from 'next'
import { SubmitAppForm } from '@/components/creator/SubmitForm'

export const metadata: Metadata = { title: 'Submit App — Rolvibe' }

export default function SubmitPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#F4F4F5] mb-2">Submit Your App</h1>
      <p className="text-[#A1A1AA] text-sm mb-8">Share what you built with the world.</p>
      <SubmitAppForm />
    </div>
  )
}
