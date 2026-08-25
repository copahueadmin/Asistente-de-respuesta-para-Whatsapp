import React from 'react'
import { useData } from '../lib/DataContext.jsx'
import { DAYS_OF_WEEK, OVERRIDE_MODES, uid, monthLabel } from '../lib/constants'

// Editor de excepciones de precio por día de semana para una categoría, aplicable
// a todos los meses ('ALL') o a un mes puntual.
export default function DayOverridesEditor({ categoryId, monthId, onClose }) {
  const { data, update } = useData()
  const overrides = data.dayOverrides.filter(o => o.categoryId === categoryId)
  const otherCategories = data.categories.filter(c => c.id !== categoryId)

  function addOverride() {
    update(prev => ({
      ...prev,
      dayOverrides: [...prev.dayOverrides, {
        id: uid('ovr'), categoryId, monthId: 'ALL', days: [], mode: 'percent', value: -10, refCategoryId: '', label: '',
      }],
    }))
  }

  function patch(id, p) {
    update(prev => ({
      ...prev,
      dayOverrides: prev.dayOverrides.map(o => o.id === id ? { ...o, ...p } : o),
    }))
  }

  function remove(id) {
    update(prev => ({ ...prev, dayOverrides: prev.dayOverrides.filter(o => o.id !== id) }))
  }

  function toggleDay(o, day) {
    const days = o.days.includes(day) ? o.days.filter(d => d !== day) : [...o.days, day]
    patch(o.id, { days })
  }

  return (
    <div className="bg-copahue-cream-dark/60 border border-copahue-gold/30 rounded-md p-3 mt-1 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-copahue-black/70">Excepciones por día de semana</p>
        <button onClick={onClose} className="text-copahue-black/40 hover:text-copahue-black">Cerrar ✕</button>
      </div>
      {overrides.length === 0 && <p className="text-copahue-black/40 italic">Sin excepciones cargadas.</p>}
      {overrides.map(o => (
        <div key={o.id} className="bg-white rounded border border-copahue-black/10 p-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            {DAYS_OF_WEEK.map(d => (
              <button
                key={d.id}
                onClick={() => toggleDay(o, d.id)}
                className={`px-1.5 py-0.5 rounded text-[10px] border ${
                  o.days.includes(d.id)
                    ? 'bg-copahue-green text-white border-copahue-green'
                    : 'border-copahue-black/20 text-copahue-black/50'
                }`}
              >{d.short}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={o.mode} onChange={e => patch(o.id, { mode: e.target.value })} className="border border-copahue-black/20 rounded px-1.5 py-1 text-[11px]">
              {OVERRIDE_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {o.mode === 'fromCategory' ? (
              <>
                <select value={o.refCategoryId} onChange={e => patch(o.id, { refCategoryId: e.target.value })} className="border border-copahue-black/20 rounded px-1.5 py-1 text-[11px]">
                  <option value="">Elegir categoría…</option>
                  {otherCategories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.group})</option>)}
                </select>
                <span>ajuste %</span>
                <input type="number" value={o.value} onChange={e => patch(o.id, { value: e.target.value })} className="w-16 border border-copahue-black/20 rounded px-1.5 py-1 text-[11px]" />
              </>
            ) : (
              <>
                <input
                  type="number"
                  value={o.value}
                  onChange={e => patch(o.id, { value: e.target.value })}
                  className="w-20 border border-copahue-black/20 rounded px-1.5 py-1 text-[11px]"
                />
                <span>{o.mode === 'percent' ? '%' : '$'}</span>
              </>
            )}
            <input
              placeholder="Etiqueta (opcional, ej: Vier. a Dom.)"
              value={o.label || ''}
              onChange={e => patch(o.id, { label: e.target.value })}
              className="flex-1 min-w-[120px] border border-copahue-black/20 rounded px-1.5 py-1 text-[11px]"
            />
            <select value={o.monthId} onChange={e => patch(o.id, { monthId: e.target.value })} className="border border-copahue-black/20 rounded px-1.5 py-1 text-[11px]">
              <option value="ALL">Todos los meses</option>
              <option value={monthId}>Solo {monthLabel(monthId)}</option>
            </select>
            <button onClick={() => remove(o.id)} className="text-red-500 hover:underline ml-auto">Eliminar</button>
          </div>
        </div>
      ))}
      <button onClick={addOverride} className="text-copahue-gold-dark hover:underline">+ agregar excepción</button>
    </div>
  )
}
