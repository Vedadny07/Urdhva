import en from '../locales/en.json'
import hi from '../locales/hi.json'
import mr from '../locales/mr.json'
import useStore from '../store'

export const LOCALES = { en, hi, mr }

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', short: 'हि', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', short: 'मर', flag: '🚩' }
]

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  const keys = path.split('.')
  let current = obj
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k]
    } else {
      return undefined
    }
  }
  return current
}

export function translate(key, params = {}, lang = 'en') {
  const dict = LOCALES[lang] || LOCALES.en
  let val = getNestedValue(dict, key)
  
  // Fallback to English if missing
  if (val === undefined && lang !== 'en') {
    val = getNestedValue(LOCALES.en, key)
  }

  if (typeof val !== 'string') {
    return val !== undefined ? val : (params.defaultValue || key)
  }

  // Parameter interpolation: {{name}} or {name}
  let result = val
  if (params && typeof params === 'object') {
    for (const [pKey, pVal] of Object.entries(params)) {
      if (pKey === 'defaultValue') continue
      result = result.replace(new RegExp(`{{\\s*${pKey}\\s*}}`, 'g'), String(pVal))
      result = result.replace(new RegExp(`{\\s*${pKey}\\s*}`, 'g'), String(pVal))
    }
  }

  return result
}

export function useTranslation() {
  const language = useStore((s) => s.language) || 'en'
  const setLanguage = useStore((s) => s.setLanguage)

  const t = (key, params = {}) => {
    return translate(key, params, language)
  }

  return { t, language, setLanguage, languages: LANGUAGES }
}

export default useTranslation
