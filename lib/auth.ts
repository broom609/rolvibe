const DEFAULT_PRODUCTION_ORIGIN = 'https://rolvibe.com'
const DEFAULT_DEVELOPMENT_ORIGIN = 'http://localhost:3000'
const RELATIVE_PATH_PATTERN = /^\/(?!\/)/

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function normalizeNextPath(next: string | null | undefined) {
  if (!next || !RELATIVE_PATH_PATTERN.test(next)) {
    return '/dashboard'
  }

  return next
}

export function getProductionOrigin() {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_PRODUCTION_ORIGIN)
}

export function getClientAuthOrigin() {
  if (process.env.NODE_ENV === 'development') {
    if (typeof window !== 'undefined' && window.location.origin) {
      return trimTrailingSlash(window.location.origin)
    }

    return DEFAULT_DEVELOPMENT_ORIGIN
  }

  return getProductionOrigin()
}

export function getServerAuthOrigin(requestUrl: string) {
  if (process.env.NODE_ENV === 'development') {
    const requestOrigin = trimTrailingSlash(new URL(requestUrl).origin)
    if (requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')) {
      return requestOrigin
    }

    return DEFAULT_DEVELOPMENT_ORIGIN
  }

  return getProductionOrigin()
}
