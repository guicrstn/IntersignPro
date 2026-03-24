'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt'

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'fr', name: 'Francais', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Espanol', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugues', flag: '🇵🇹' },
]

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'intersign-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [translations, setTranslations] = useState<Record<string, string>>({})

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null
    if (saved && LANGUAGES.some(l => l.code === saved)) {
      setLanguageState(saved)
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language
      if (LANGUAGES.some(l => l.code === browserLang)) {
        setLanguageState(browserLang)
      }
    }
  }, [])

  // Load translations when language changes
  useEffect(() => {
    async function loadTranslations() {
      try {
        const module = await import(`./translations/${language}.json`)
        setTranslations(module.default)
      } catch {
        // Fallback to French if translation file not found
        const module = await import('./translations/fr.json')
        setTranslations(module.default)
      }
    }
    loadTranslations()
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    // Update HTML lang attribute
    document.documentElement.lang = lang
  }

  // Translation function with parameter interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[key] || key
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value))
      })
    }
    
    return text
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Hook for getting just the translation function (more convenient)
export function useTranslation() {
  const { t, language } = useLanguage()
  return { t, language }
}
