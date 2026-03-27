import type { AppReview } from '@/types'

type ReviewInput = {
  name: string
  tagline: string
  description?: string | null
  category: string
  tags?: string[] | null
  thumbnail_url?: string | null
  screenshots?: string[] | null
  app_url: string
  pricing_type: string
  built_with?: string | null
}

export function computeAppReview(input: ReviewInput): Omit<AppReview, 'app_id' | 'created_at' | 'updated_at' | 'checked_at'> {
  const reasons: string[] = []
  const flags: string[] = []

  const screenshotCount = (input.screenshots || []).filter(Boolean).length
  const hasThumbnail = Boolean(input.thumbnail_url)
  const descriptionLength = (input.description || '').trim().length
  const taglineLength = input.tagline.trim().length
  const usesHttps = input.app_url.startsWith('https://')
  const hasCategory = Boolean(input.category)
  const hasTags = (input.tags || []).length > 0
  const hasBuilder = Boolean(input.built_with)

  const visual_quality_score = Math.min(
    100,
    (hasThumbnail ? 45 : 0) + Math.min(40, screenshotCount * 20) + (screenshotCount >= 2 ? 15 : 0)
  )

  const description_quality_score = Math.min(
    100,
    (taglineLength >= 20 ? 30 : 15) +
      (descriptionLength >= 200 ? 45 : descriptionLength >= 80 ? 30 : descriptionLength > 0 ? 15 : 0) +
      (hasTags ? 10 : 0) +
      (hasBuilder ? 15 : 0)
  )

  const trust_score = Math.min(100, (usesHttps ? 35 : 0) + (hasThumbnail ? 20 : 0) + (hasCategory ? 20 : 0) + (hasTags ? 10 : 0) + (hasBuilder ? 15 : 0))
  const launch_quality_score = Math.min(100, (usesHttps ? 35 : 0) + (descriptionLength >= 80 ? 25 : 10) + (screenshotCount >= 2 ? 20 : screenshotCount ? 10 : 0) + (input.pricing_type === 'free' ? 20 : 10))
  const thumbnail_quality_score = hasThumbnail ? Math.min(100, 50 + screenshotCount * 10) : 0
  const category_fit_score = hasCategory ? Math.min(100, 60 + ((input.tags || []).length * 8)) : 25

  let spam_risk_score = 0
  if (input.name.trim().length < 3) spam_risk_score += 20
  if (taglineLength < 15) spam_risk_score += 20
  if (!hasThumbnail) spam_risk_score += 15
  if (!usesHttps) spam_risk_score += 35
  if ((input.tags || []).length === 0) spam_risk_score += 10
  if (/free money|crypto giveaway|casino|adult/i.test(`${input.name} ${input.tagline} ${input.description || ''}`)) {
    spam_risk_score += 35
    flags.push('suspicious_keywords')
  }
  spam_risk_score = Math.min(100, spam_risk_score)

  if (!hasThumbnail) reasons.push('Add a thumbnail to improve storefront quality.')
  if (screenshotCount === 0) reasons.push('Add screenshots so people can understand the app before clicking.')
  if (descriptionLength < 80) reasons.push('The description is thin. Add more detail about what the app does and who it is for.')
  if (!hasTags) reasons.push('Add a few tags to improve discovery and category fit.')
  if (!usesHttps) flags.push('non_https_app_url')

  const rawOverall =
    visual_quality_score * 0.2 +
    description_quality_score * 0.2 +
    trust_score * 0.2 +
    launch_quality_score * 0.2 +
    thumbnail_quality_score * 0.1 +
    category_fit_score * 0.1 -
    spam_risk_score * 0.25

  const overall_score = Math.max(0, Math.min(100, Math.round(rawOverall)))

  const recommendation =
    spam_risk_score >= 60 || overall_score < 45
      ? 'reject'
      : overall_score >= 75 && spam_risk_score < 30
        ? 'approve'
        : 'review'

  return {
    overall_score,
    visual_quality_score,
    description_quality_score,
    trust_score,
    launch_quality_score,
    thumbnail_quality_score,
    category_fit_score,
    spam_risk_score,
    recommendation,
    reasons,
    flags,
  }
}

export async function runAppHealthCheck(appUrl: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)

  try {
    let response = await fetch(appUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    })

    if (response.status === 405) {
      response = await fetch(appUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        cache: 'no-store',
      })
    }

    if (!response.ok) {
      return {
        health_status: response.status >= 500 ? ('broken' as const) : ('degraded' as const),
        admin_notes: `Health check returned HTTP ${response.status}.`,
      }
    }

    return {
      health_status: 'healthy' as const,
      admin_notes: null,
    }
  } catch (error) {
    return {
      health_status: 'broken' as const,
      admin_notes: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  } finally {
    clearTimeout(timeout)
  }
}
