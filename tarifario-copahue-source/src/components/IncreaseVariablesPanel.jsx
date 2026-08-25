import React from 'react'
import { useData } from '../lib/DataContext.jsx'

// Panel lateral discreto con hasta 3 variables de % de aumento, aplicables a
// todas las categorías y meses de la tarifa mostrador cuando están activas.
export default function IncreaseVariablesPanel() {
  const { data, update } = useData()
  const vars = data.increaseVariables || []

  function setVar(id, patch) {
    update(prev => ({
      ...prev,
      increaseVariables: prev.increaseVariables.map(v => v.id === id ? { ...v, ...patch } : v),
    }))
  }

  function addVar() {
    if (vars.length >= 3) return
    update(prev => ({
      ...prev,
      increaseVariables: [...prev.increaseVariables, { id: Date.now().toString(36), label: `Aumento ${prev.increaseVariables.length + 1}`, percent: 10, active: false }],
    }))
  }

  function removeVar(id) {
    update(prev => ({ ...prev, increaseVariables: prev.increaseVariables.filter(v => v.id !== id) }))
  }

  return (
    <div className="w-full sm:w-56 shrink-0 no-print">
      <div className="border border-copahue-black/10 rounded-md bg-white/60 p-3 text-[11px]">
        <p className="text-copahue-black/40 uppercase tracking-wide font-medium mb-2">Opciones de aumento</p>
        <div className="space-y-2">
          {vars.map(v => (
            <div key={v.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={v.active}
                onChange={e => setVar(v.id, { active: e.target.checked })}
                className="accent-copahue-gold-dark"
              />
              <input
                className="w-16 border border-copahue-black/10 rounded px-1 py-0.5 text-[11px]"
                value={v.label}
                onChange={e => setVar(v.id, { label: e.target.value })}
              />
              <input
                type="number"
                className="w-12 border border-copahue-black/10 rounded px-1 py-0.5 text-[11px] text-right"
                value={v.percent}
                onChange={e => setVar(v.id, { percent: e.target.value === '' ? '' : Number(e.target.value) })}
              />
              <span className="text-copahue-black/40">%</span>
              <button onClick={() => removeVar(v.id)} className="text-copahue-black/30 hover:text-red-500 ml-auto">✕</button>
            </div>
          ))}
        </div>
        {vars.length < 3 && (
          <button onClick={addVar} className="mt-2 text-[11px] text-copahue-gold-dark hover:underline">+ agregar variable</button>
        )}
      </div>
    </div>
  )
}
