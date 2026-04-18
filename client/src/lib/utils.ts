import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getLocale } from '$lib/paraglide/runtime'
import { m } from '$lib/paraglide/messages'

const ERROR_TRANSLATIONS: Record<string, () => string> = {
  MUST_BE_LOGGED_IN: () => m.error_must_be_logged_in(),
  INVALID_CREDENTIALS: () => m.invalid_email_or_password(),
  UNSUPPORTED_URL: () => m.error_unsupported_url(),
  SERVICE_DISABLED: () => m.error_service_disabled(),
  NO_MBID: () => m.error_no_mbid(),
}

/** Translates a tRPC error code returned from the API into a localised string. Falls back to the raw code if unknown. */
export function translateError(code: string): string {
  return ERROR_TRANSLATIONS[code]?.() ?? code
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }

const TIME_UNITS = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
} as const

type TimeUnit = keyof typeof TIME_UNITS

export const getRelativeTime = (d1: Date, d2?: Date, isShort?: boolean) => {
  const locale = getLocale()
  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: isShort ? 'short' : 'long',
  })
  const elapsed = d1.getTime() - (d2 || new Date()).getTime()

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (const u in TIME_UNITS) {
    const unit = u as TimeUnit
    if (Math.abs(elapsed) > TIME_UNITS[unit] || unit === 'second') {
      return rtf.format(Math.round(elapsed / TIME_UNITS[unit]), unit)
    }
  }
}
