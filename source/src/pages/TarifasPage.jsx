import React, { useEffect, useMemo, useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { CAPACITY_GROUPS, monthLabel, addMonths, compareMonths, formatARS, uid, isMonthExpired } from '../lib/constants'
import { getBaseRate, applyIncrease } from '../lib/calc'
import IncreaseVariablesPanel from '../components/IncreaseVariablesPanel.jsx'
import DayOverridesEditor from '../components/DayOverridesEditor.jsx'

export default function TarifasPage() {
  const { data, update } = useData()
  const allMonths = useMemo(() => [...data.months].sort(compareMonths), [data.months])
  const vigentMonths = useMemo(() => allMonths.filter(m => !isMonthExpired(m)), [allMonths])
  const [selectedMonth, setSelectedMonth] = useState(vigentMonths[0] || '')
  const [openOverrides, setOpenOverrides] = useState(null)

  const monthId = vigentMonths.includes(selectedMonth) ? selectedMonth : vigentMonths[0]
  const activeVars = (data.increaseVariables || []).filter(v => v.active)

  // Borrador de precios: los cambios en la grilla no se guardan hasta apretar
  // "Guardar cambios", para evitar escrituras en cada tecla.
  const [draft, setDraft] = useState({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const next = {}
    for (const c of data.categories) {
      next[c.id] = getBaseRate(data.monthlyRates, monthId, c.id)
    }
    setDraft(next)
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthId])

  function setPrice(categoryId, value) {
    setDraft(prev => ({ ...prev, [categoryId]: value === '' ? null : Number(value) }))
    setDirty(true)
  }

  function saveChanges() {
    if (!monthId) return
    update(prev => {
      const monthlyRates = [...prev.monthlyRates]
      for (const c of prev.categories) {
        const val = draft[c.id]
        const existing = monthlyRates.find(r => r.monthId === monthId && r.categoryId === c.id)
        if (existing) {
          existing.basePrice = val === undefined ? existing.basePrice : val
        } else if (val !== undefined) {
          monthlyRates.push({ id: uid('rate'), monthId, categoryId: c.id, basePrice: val })
        }
      }
      return { ...prev, monthlyRates: [...monthlyRates] }
    })
    setDirty(false)
  }

  function confirmDiscardIfDirty() {
    if (!dirty) return true
    return confirm('Hay cambios sin guardar en este mes. ¿Descartarlos?')
  }

  function changeMonth(m) {
    if (!confirmDiscardIfDirty()) return
    setSelectedMonth(m)
  }

  function addMonth() {
    if (!confirmDiscardIfDirty()) return
    const last = allMonths[allMonths.length - 1]
    const next = last ? addMonths(last, 1) : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    if (data.months.includes(next)) { setSelectedMonth(next); return }
    update(prev => ({ ...prev, months: [...prev.months, next] }))
    setSelectedMonth(next)
  }

  function removeMonth() {
    if (!monthId) return
    if (!confirm(`¿Eliminar ${monthLabel(monthId)} y todos sus precios cargados?`)) return
    update(prev => ({
      ...prev,
      months: prev.months.filter(m => m !== monthId),
      monthlyRates: prev.monthlyRates.filter(r => r.monthId !== monthId),
    }))
    setDirty(false)
    setSelectedMonth(vigentMonths.find(m => m !== monthId) || '')
  }

  function copyFromPreviousMonth() {
    const idx = allMonths.indexOf(monthId)
    if (idx <= 0) return
    const prevMonth = allMonths[idx - 1]
    const next = {}
    for (const c of data.categories) {
      next[c.id] = getBaseRate(data.monthlyRates, prevMonth, c.id)
    }
    setDraft(next)
    setDirty(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h2 className="font-display text-2xl text-copahue-green">Tarifa Mostrador</h2>
          <p className="text-sm text-copahue-black/60 mt-1">Precio destacado por categoría, mes a mes.</p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-xs text-copahue-black/50 mb-1">Mes</label>
            <select
              value={monthId || ''}
              onChange={e => changeMonth(e.target.value)}
              className="border border-copahue-black/20 rounded px-3 py-1.5 text-sm min-w-[160px]"
            >
              {vigentMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>
          <button onClick={copyFromPreviousMonth} className="text-xs px-3 py-1.5 rounded border border-copahue-black/20 hover:bg-copahue-black/5">
            Copiar mes anterior
          </button>
          <button onClick={addMonth} className="text-xs px-3 py-1.5 rounded bg-copahue-green text-white hover:bg-copahue-green-dark">
            + Agregar mes
          </button>
          <button onClick={removeMonth} className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50">
            Eliminar mes
          </button>
          <button
            onClick={saveChanges}
            disabled={!dirty}
            className="text-xs px-3 py-1.5 rounded bg-copahue-gold text-copahue-black font-semibold hover:bg-copahue-gold-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {dirty ? 'Guardar cambios •' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {!monthId ? (
        <p className="text-copahue-black/50 italic">No hay meses vigentes cargados. Agregá uno para empezar.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex-1 w-full grid md:grid-cols-2 gap-4">
            {CAPACITY_GROUPS.map(group => {
              const cats = data.categories.filter(c => c.group === group.id && c.active)
              if (cats.length === 0) return null
              return (
                <div key={group.id} className="bg-white border border-copahue-black/10 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-copahue-green text-copahue-gold-light font-display text-lg px-4 py-2">
                    {group.label}
                  </div>
                  <ul className="divide-y divide-copahue-black/5">
                    {cats.map(c => {
                      const base = draft[c.id] === undefined ? getBaseRate(data.monthlyRates, monthId, c.id) : draft[c.id]
                      const hasOverrides = data.dayOverrides.some(o => o.categoryId === c.id)
                      return (
                        <li key={c.id} className="px-4 py-3">
                          <div className="grid grid-cols-[minmax(0,132px)_108px_1fr_auto] items-center gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-copahue-black leading-tight">{c.name}</p>
                              {c.rooms && <p className="text-[11px] text-copahue-black/45 leading-tight">{c.rooms}</p>}
                            </div>
                            <div className="flex items-baseline gap-1 text-left">
                              <span className="text-copahue-black/45 text-sm price-figure">$</span>
                              <input
                                type="number"
                                value={base === null ? '' : base}
                                onChange={e => setPrice(c.id, e.target.value)}
                                placeholder="—"
                                className="w-24 text-left price-figure text-xl font-bold text-copahue-green border-b-2 border-copahue-gold/50 focus:border-copahue-gold focus:outline-none bg-transparent"
                              />
                            </div>
                            <div className="text-left">
                              {activeVars.length > 0 && base !== null && (
                                <div className="flex flex-col gap-0.5">
                                  {activeVars.map(v => (
                                    <span key={v.id} className="text-[10px] text-copahue-black/35 italic price-figure">
                                      {formatARS(applyIncrease(base, v.percent))} <span className="not-italic">+{v.percent}%</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setOpenOverrides(openOverrides === c.id ? null : c.id)}
                              className={`text-[10px] px-1.5 py-1 rounded border shrink-0 ${hasOverrides ? 'border-copahue-gold text-copahue-gold-dark' : 'border-copahue-black/15 text-copahue-black/40'}`}
                              title="Excepciones por día de semana"
                            >
                              días ▾
                            </button>
                          </div>
                          {openOverrides === c.id && (
                            <DayOverridesEditor categoryId={c.id} monthId={monthId} onClose={() => setOpenOverrides(null)} />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
          <IncreaseVariablesPanel />
        </div>
      )}
    </div>
  )
}
