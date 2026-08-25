import React, { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { saveFirebaseConfig, clearFirebaseConfig, getSavedFirebaseConfig, isUsingDefaultFirebaseConfig } from '../lib/firebaseClient'
import { buildFullSeed } from '../lib/seedData'

const RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`

// El login ya se pide a nivel de toda la app (ver App.jsx) antes de llegar
// acá, así que esta página no necesita su propio formulario de acceso.
export default function ConfiguracionPage() {
  const { data, update, mode } = useData()
  const [configText, setConfigText] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const existing = getSavedFirebaseConfig()
  const usingDefault = isUsingDefaultFirebaseConfig()

  function parseAndSave() {
    setError('')
    try {
      let text = configText.trim()
      text = text.replace(/^\s*(export\s+)?const\s+firebaseConfig\s*=\s*/i, '')
      text = text.replace(/;\s*$/, '')
      // eslint-disable-next-line no-new-func
      const obj = new Function('return (' + text + ')')()
      if (!obj || !obj.projectId) {
        setError('No se encontró "projectId" en el objeto pegado. Revisá que copiaste el bloque completo de firebaseConfig.')
        return
      }
      saveFirebaseConfig(obj)
      setSaved(true)
      setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      setError('No se pudo interpretar el texto pegado. Asegurate de pegar el objeto firebaseConfig tal cual te lo dio Firebase.')
    }
  }

  function disconnect() {
    if (!confirm('¿Dejar de usar Firebase y volver a guardado local?')) return
    clearFirebaseConfig()
    window.location.reload()
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tarifario_copahue_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        if (!confirm('Esto reemplaza todos los datos actuales por los del archivo. ¿Continuar?')) return
        update(() => obj)
      } catch {
        alert('Archivo inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function resetToSeed() {
    if (!confirm('Esto borra todo lo cargado y vuelve a los datos de ejemplo iniciales. ¿Continuar?')) return
    update(() => buildFullSeed())
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl text-copahue-green">Configuración</h2>
        <p className="text-sm text-copahue-black/60 mt-1">
          Estado actual: <strong>{mode === 'firebase' ? 'Conectado a Firebase (nube)' : 'Guardado local en este navegador'}</strong>
          {mode === 'firebase' && usingDefault && ' — proyecto compartido con el Asistente de respuestas'}
        </p>
      </div>

      <section className="bg-white border border-copahue-black/10 rounded-lg p-4 space-y-3">
        <h3 className="font-display text-lg text-copahue-green">Conectar Firebase</h3>
        <p className="text-sm text-copahue-black/60">
          Pegá acá el bloque completo <code className="bg-copahue-black/5 px-1 rounded">firebaseConfig</code> que te muestra Firebase al registrar la app web.
        </p>
        <textarea
          value={configText}
          onChange={e => setConfigText(e.target.value)}
          rows={7}
          placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};`}
          className="w-full border border-copahue-black/20 rounded px-3 py-2 text-xs font-mono"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">Guardado. Recargando…</p>}
        <div className="flex gap-2">
          <button onClick={parseAndSave} className="px-4 py-2 rounded bg-copahue-green text-white text-sm font-medium hover:bg-copahue-green-dark">
            Guardar y conectar
          </button>
          {existing && (
            <button onClick={disconnect} className="px-4 py-2 rounded border border-red-300 text-red-600 text-sm hover:bg-red-50">
              Desconectar Firebase
            </button>
          )}
        </div>
        <details className="text-xs text-copahue-black/60 mt-2">
          <summary className="cursor-pointer text-copahue-gold-dark">Reglas de Firestore (acceso libre, sin login)</summary>
          <p className="mt-2">En Firestore → pestaña <strong>Reglas</strong>, pegá esto y publicá:</p>
          <pre className="bg-copahue-black text-copahue-cream text-[11px] p-3 rounded mt-1 overflow-auto">{RULES_SNIPPET}</pre>
        </details>
      </section>

      <section className="bg-white border border-copahue-black/10 rounded-lg p-4 space-y-3">
        <h3 className="font-display text-lg text-copahue-green">Copia de seguridad</h3>
        <p className="text-sm text-copahue-black/60">Exportá todo lo cargado a un archivo, o restaurá desde uno anterior (útil para registro histórico de tarifas de años pasados).</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJson} className="px-4 py-2 rounded border border-copahue-gold text-copahue-gold-dark text-sm hover:bg-copahue-gold/10">
            Exportar datos (.json)
          </button>
          <label className="px-4 py-2 rounded border border-copahue-black/20 text-sm hover:bg-copahue-black/5 cursor-pointer">
            Importar datos (.json)
            <input type="file" accept="application/json" onChange={importJson} className="hidden" />
          </label>
        </div>
      </section>

      <section className="bg-white border border-red-200 rounded-lg p-4 space-y-3">
        <h3 className="font-display text-lg text-red-700">Zona de riesgo</h3>
        <button onClick={resetToSeed} className="px-4 py-2 rounded border border-red-300 text-red-600 text-sm hover:bg-red-50">
          Restaurar datos de ejemplo iniciales
        </button>
      </section>
    </div>
  )
}
