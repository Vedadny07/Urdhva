import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Optional production backend base (for GitHub Pages/static hosting):
// set VITE_API_BASE_URL to the deployed FastAPI origin. Local development
// keeps relative /api requests so Vite's proxy continues to work.
if (typeof window !== 'undefined') {
  const apiBase = String(import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (apiBase && !window.__URDHVA_FETCH_PATCHED__) {
    const nativeFetch = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const rawUrl = typeof input === 'string' ? input : input?.url
      if (rawUrl && rawUrl.startsWith('/api/')) {
        const target = `${apiBase}${rawUrl}`
        if (typeof input === 'string') return nativeFetch(target, init)
        return nativeFetch(new Request(target, input), init)
      }
      return nativeFetch(input, init)
    }
    window.__URDHVA_FETCH_PATCHED__ = true
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
