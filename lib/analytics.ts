export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  // TODO: replace with PostHog or Plausible in production
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, props)
  }
}
