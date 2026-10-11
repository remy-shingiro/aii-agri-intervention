import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { loadAgriculturalObservations } from './features/evidence/data/loadAgriculturalEvidence'

const root = createRoot(document.getElementById('root')!)

function showStartupMessage(message: string, isError = false) {
  root.render(
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section
        aria-live={isError ? undefined : 'polite'}
        className="max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
        role={isError ? 'alert' : 'status'}
      >
        <h1 className="text-lg font-semibold text-slate-900">
          Agricultural Intervention Intelligence
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        {isError && (
          <button
            className="mt-4 min-h-10 rounded-md bg-green-800 px-4 text-sm font-semibold text-white hover:bg-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload AII
          </button>
        )}
      </section>
    </main>,
  )
}

async function startApplication() {
  showStartupMessage('Loading the connected agricultural evidence…')

  try {
    await loadAgriculturalObservations()
    const { default: App } = await import('./App.tsx')
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Failed to load AII application data or code:', error)
    showStartupMessage(
      'AII could not load its connected data or application files. Check the connection and reload the page.',
      true,
    )
  }
}

void startApplication()
