import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getLocale } from '$lib/paraglide/runtime'

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

const TIME_UNIT_LABEL = {
  year: 'year',
  month: 'month',
  day: 'day',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
}

type TimeUnit = keyof typeof TIME_UNITS

export const getRelativeTime = (d1: Date, d2?: Date) => {
  const locale = getLocale()
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const elapsed = d1.getTime() - (d2 || new Date()).getTime()

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (const u in TIME_UNITS) {
    const unit = u as TimeUnit
    if (Math.abs(elapsed) > TIME_UNITS[unit] || unit === 'second') {
      return rtf.format(Math.round(elapsed / TIME_UNITS[unit]), unit)
    }
  }
}
