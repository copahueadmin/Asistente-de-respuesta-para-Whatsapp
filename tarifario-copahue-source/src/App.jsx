import React, { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import CategoriasPage from './pages/CategoriasPage.jsx'
import TarifasPage from './pages/TarifasPage.jsx'
import ExtrasPage from './pages/ExtrasPage.jsx'
import ImprimirPage from './pages/ImprimirPage.jsx'
import ConfiguracionPage from './pages/ConfiguracionPage.jsx'
import VencidasPage from './pages/VencidasPage.jsx'
import TarifariosPage from './pages/TarifariosPage.jsx'
import LoginGate from './components/LoginGate.jsx'
import { isAuthed, setAuthed } from './lib/auth'
import { useData } from './lib/DataContext.jsx'
import logo from './assets/brand/logo.png'

// URL del Asistente de respuestas (misma web que aloja este Tarifario, en la raíz del sitio).
const ASISTENTE_URL = 'https://asistente-de-respuesta-hotelcopahue.netlify.app/'

const NAV = [
  { to: '/', label: 'Tarifas', end: true },
  { to: '/categorias', label: 'Categorías' },
  { to: '/extras', label: 'Cochera, Salón y Fotos' },
  { to: '/vencidas', label: 'Vencidas' },
  { to: '/tarifarios', label: 'Otros tarifarios' },
  { to: '/imprimir', label: 'Imprimir / PDF' },
  { to: '/configuracion', label: 'Configuración' },
]

// Todas las secciones requieren haber iniciado sesión, excepto Imprimir/PDF
// (el cuadro de tarifas es de acceso público, sin login).
export default function App() {
  const { mode, firebaseError } = useData()
  const [authed, setAuthedState] = useState(() => isAuthed())

  function handleLogin() {
    setAuthed(true)
    setAuthedState(true)
  }

  function handleLogout() {
    setAuthed(false)
    setAuthedState(false)
  }

  function gated(element) {
    if (authed) return element
    return (
      <LoginGate
        onSuccess={handleLogin}
        title="Acceso administrador"
        subtitle="Iniciá sesión para configurar el tarifario. El cuadro de tarifas para imprimir es de acceso público, sin necesidad de ingresar."
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-copahue-cream">
      <header className="bg-copahue-black text-copahue-cream border-b-4 border-copahue-gold no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col items-start gap-0.5">
            <img src={logo} alt="Hotel Copahue" className="h-11 sm:h-12 w-auto object-contain" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-copahue-cream/70 pl-0.5">
              sistema tarifario
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-copahue-gold text-copahue-black'
                      : 'text-copahue-cream/80 hover:bg-copahue-green/60 hover:text-copahue-gold-light'
                  }`
                }
              >
                {item.label}
                {authed || item.to === '/imprimir' ? '' : ' 🔒'}
              </NavLink>
            ))}
            <a
              href={ASISTENTE_URL}
              className="ml-2 text-xs px-3 py-1.5 rounded border border-copahue-gold/50 text-copahue-gold-light hover:bg-copahue-gold/10 whitespace-nowrap"
            >
              ← Volver a generar respuestas
            </a>
            {authed && (
              <button
                onClick={handleLogout}
                className="ml-2 text-xs px-3 py-1.5 rounded border border-copahue-cream/30 text-copahue-cream/70 hover:bg-copahue-cream/10"
              >
                Cerrar sesión
              </button>
            )}
          </nav>
        </div>
        <div className="h-1 bg-gradient-to-r from-copahue-green via-copahue-gold to-copahue-green" />
      </header>

      {firebaseError && (
        <div className="no-print bg-amber-100 border-b border-amber-300 text-amber-900 text-sm px-4 py-2">
          {firebaseError}
        </div>
      )}
      {mode === 'local' && (
        <div className="no-print bg-copahue-green/10 border-b border-copahue-green/30 text-copahue-green text-xs px-4 py-1.5 text-center">
          Guardando en este navegador (modo local). Conectá Firebase desde <strong>Configuración</strong> para guardar en la nube y compartir entre dispositivos.
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={gated(<TarifasPage />)} />
          <Route path="/categorias" element={gated(<CategoriasPage />)} />
          <Route path="/extras" element={gated(<ExtrasPage />)} />
          <Route path="/vencidas" element={gated(<VencidasPage />)} />
          <Route path="/tarifarios" element={gated(<TarifariosPage />)} />
          <Route path="/imprimir" element={<ImprimirPage />} />
          <Route path="/configuracion" element={gated(<ConfiguracionPage />)} />
        </Routes>
      </main>

      <footer className="no-print text-center text-xs text-copahue-black/50 py-4">
        Hotel Copahue — Tarifario interno
      </footer>
    </div>
  )
}
