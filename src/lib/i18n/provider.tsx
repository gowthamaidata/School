'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { translate, type Locale, type TranslationKey } from './dictionary'

type Theme = 'light' | 'dark'

interface PrefsValue {
  locale: Locale
  setLocale: (l: Locale) => void
  theme: Theme
  setTheme: (t: Theme) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const PrefsContext = createContext<PrefsValue | null>(null)

const LOCALE_KEY = 'palli.locale'
const THEME_KEY = 'palli.theme'

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode / blocked storage — preference just won't persist */
  }
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [theme, setThemeState] = useState<Theme>('light')

  // Hydrate from storage after mount (avoids SSR mismatch)
  useEffect(() => {
    const storedLocale = safeGet(LOCALE_KEY)
    if (storedLocale === 'en' || storedLocale === 'ta') setLocaleState(storedLocale)

    const storedTheme = safeGet(THEME_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setThemeState(storedTheme)
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark')
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.lang = locale
  }, [theme, locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    safeSet(LOCALE_KEY, l)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    safeSet(THEME_KEY, t)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let out = translate(key, locale)
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return out
    },
    [locale],
  )

  return (
    <PrefsContext.Provider value={{ locale, setLocale, theme, setTheme, t }}>
      {children}
    </PrefsContext.Provider>
  )
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>')
  return ctx
}

/** Convenience hook when you only need the translate function. */
export function useT() {
  return usePrefs().t
}
