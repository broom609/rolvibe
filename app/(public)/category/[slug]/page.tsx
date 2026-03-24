import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CATEGORIES } from '@/types'
import { CategoryFeedClient } from './CategoryFeedClient'

function slugToCategory(slug: string): string | undefined {
  return CATEGORIES.find(
    cat => cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === slug
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = slugToCategory(slug)
  if (!category) return { title: 'Category Not Found — Rolvibe' }
  return {
    title: `${category} Apps — Rolvibe`,
    description: `Discover the best AI-built ${category} apps on Rolvibe.`,
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = slugToCategory(slug)
  if (!category) notFound()

  return <CategoryFeedClient category={category} />
}
