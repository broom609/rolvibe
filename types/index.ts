export type UserRole = 'user' | 'creator' | 'admin'
export type PricingType = 'free' | 'paid' | 'subscription' | 'invite_only' | 'coming_soon'
export type AppStatus = 'pending' | 'active' | 'rejected' | 'archived' | 'hidden'
export type HealthStatus = 'healthy' | 'degraded' | 'broken' | 'unknown'
export type ReportReason = 'broken' | 'misleading' | 'spam' | 'inappropriate' | 'scam' | 'copyright' | 'other'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  website_url: string | null
  twitter_handle: string | null
  role: UserRole
  stripe_account_id: string | null
  stripe_onboarded: boolean
  total_try_count: number
  total_earnings_cents: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface App {
  id: string
  creator_id: string
  name: string
  slug: string
  tagline: string
  description: string | null
  app_url: string
  thumbnail_url: string | null
  screenshots: string[]
  category: string
  tags: string[]
  built_with: string | null
  pricing_type: PricingType
  price_cents: number | null
  subscription_price_cents: number | null
  stripe_product_id: string | null
  stripe_price_id: string | null
  status: AppStatus
  rejection_reason: string | null
  is_featured: boolean
  is_nsfw: boolean
  health_status: HealthStatus
  last_health_check: string | null
  try_count: number
  favorite_count: number
  score: number
  admin_notes: string | null
  submitted_at: string
  published_at: string | null
  created_at: string
  updated_at: string
  // Joined
  creator?: Profile
}

export interface AppTry {
  id: string
  app_id: string
  user_id: string | null
  session_seconds: number | null
  referrer: string | null
  user_agent: string | null
  created_at: string
}

export interface Favorite {
  user_id: string
  app_id: string
  created_at: string
}

export interface Report {
  id: string
  app_id: string
  reporter_id: string | null
  reason: ReportReason
  details: string | null
  status: 'open' | 'resolved' | 'dismissed'
  created_at: string
}

export interface Purchase {
  id: string
  app_id: string
  buyer_id: string
  creator_id: string
  amount_cents: number
  platform_fee_cents: number
  creator_payout_cents: number
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  status: 'pending' | 'completed' | 'refunded'
  created_at: string
}

export const CATEGORIES = [
  'AI Tools',
  'Productivity',
  'Finance',
  'Health',
  'Social',
  'Travel',
  'Games',
  'Creative',
  'Dev Tools',
  'Education',
  'Food',
  'Weird & Fun',
] as const

export type Category = typeof CATEGORIES[number]

export const BUILT_WITH_OPTIONS = [
  'Cursor',
  'Lovable',
  'Bolt',
  'v0',
  'Replit',
  'Windsurf',
  'Base44',
  'Claude Code',
  'Other',
] as const

export type BuiltWith = typeof BUILT_WITH_OPTIONS[number]

export const CATEGORY_COLORS: Record<string, string> = {
  'AI Tools':     'bg-purple-100 text-purple-800',
  'Productivity': 'bg-blue-100 text-blue-800',
  'Finance':      'bg-emerald-100 text-emerald-800',
  'Health':       'bg-pink-100 text-pink-800',
  'Social':       'bg-rose-100 text-rose-800',
  'Travel':       'bg-cyan-100 text-cyan-800',
  'Games':        'bg-orange-100 text-orange-800',
  'Creative':     'bg-violet-100 text-violet-800',
  'Dev Tools':    'bg-indigo-100 text-indigo-800',
  'Education':    'bg-lime-100 text-lime-800',
  'Food':         'bg-red-100 text-red-800',
  'Weird & Fun':  'bg-gray-100 text-gray-700',
}

export const CATEGORY_GRADIENTS: Record<string, string> = {
  'AI Tools':     'from-purple-500 to-purple-700',
  'Productivity': 'from-blue-500 to-blue-700',
  'Finance':      'from-emerald-500 to-emerald-700',
  'Health':       'from-pink-500 to-pink-700',
  'Social':       'from-rose-500 to-rose-700',
  'Travel':       'from-cyan-500 to-cyan-700',
  'Games':        'from-orange-500 to-orange-700',
  'Creative':     'from-violet-500 to-violet-700',
  'Dev Tools':    'from-indigo-500 to-indigo-700',
  'Education':    'from-lime-500 to-lime-700',
  'Food':         'from-red-500 to-red-700',
  'Weird & Fun':  'from-gray-500 to-gray-700',
}

export interface FeedCursor {
  score: number
  published_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  cursor: FeedCursor | null
  hasMore: boolean
}
