import React, { useState } from 'react'
import { ADMIN_USER, ADMIN_PASS, setAuthed } from '../lib/auth'

// Formulario de acceso administrador, reutilizado en toda la app: se muestra
// en lugar del contenido de cualquier sección que requiera login.
export default function LoginGate({ onSuccess, title, subtitle }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
      setError('')
      setAuthed(true)
      onSuccess()
    } else {
      setError('Usuario o clave incorrectos.')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="bg-white border border-copahue-black/10 rounded-lg p-6 shadow-sm">
        <h2 className="font-display text-xl text-copahue-green mb-1">{title || 'Acceso administrador'}</h2>
        <p className="text-sm text-copahue-black/60 mb-4">
          {subtitle || 'Esta sección es privada. El cuadro de tarifas para imprimir es de acceso público.'}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-copahue-black/50 mb-1">Usuario (CUIT)</label>
            <input
              value={user}
              onChange={e => setUser(e.target.value)}
              className="w-full border border-copahue-black/20 rounded px-3 py-2 text-sm"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs text-copahue-black/50 mb-1">Clave</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full border border-copahue-black/20 rounded px-3 py-2 text-sm"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full px-4 py-2 rounded bg-copahue-green text-white text-sm font-medium hover:bg-copahue-green-dark">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
