import { createContext, useContext, useState } from 'react'
import { translations } from './translations'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('finance_lang') || 'en')

  function t(key, vars = {}) {
    let str = (translations[lang] ?? translations.en)[key] ?? key
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v))
    }
    return str
  }

  function toggleLang() {
    const next = lang === 'en' ? 'pt' : 'en'
    setLang(next)
    localStorage.setItem('finance_lang', next)
  }

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}