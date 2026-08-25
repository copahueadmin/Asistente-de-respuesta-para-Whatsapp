import React from 'react'
import { useData } from '../lib/DataContext.jsx'
import { CAPACITY_GROUPS, uid } from '../lib/constants'

// Un "tarifario" acá es una variante calculada a partir del mostrador: se le
// suma o resta un % (por categoría, o el mismo % para todas con "Aplicar a
// todas") y opcionalmente se muestra también en dólares. Ej: "Otas" (+20%,
// con dólares) o "UNNOBA" (-10% variable por categoría). Se define acá y
// después, en Imprimir/PDF, se elige cuáles incluir en la hoja o el PDF.
export default function TarifariosPage() {
  const { data, update } = useData()
  const tariffTypes = data.tariffTypes || []

  function updateTariff(id, patch) {
    update(prev => ({
      ...prev,
      tariffTypes: prev.tariffTypes.map(t => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }

  function updateUsd(id, patch) {
    update(prev => ({
      ...prev,
      tariffTypes: prev.tariffTypes.map(t => (t.id === id ? { ...t, usd: { ...t.usd, ...patch } } : t)),
    }))
  }

  function setCategoryPercent(id, catId, value) {
    update(prev => ({
      ...prev,
      tariffTypes: prev.tariffTypes.map(t =>
        t.id === id ? { ...t, categoryPercents: { ...t.categoryPercents, [catId]: value } } : t
      ),
    }))
  }

  function toggleCategoryIncluded(id, catId) {
    update(prev => ({
      ...prev,
      tariffTypes: prev.tariffTypes.map(t => {
        if (t.id !== id) return t
        const included = t.includedCategoryIds || prev.categories.map(c => c.id)
        const next = included.includes(catId) ? included.filter(x => x !== catId) : [...included, catId]
        return { ...t, includedCategoryIds: next }
      }),
    }))
  }

  function applyDefaultToAll(id) {
    update(prev => ({
      ...prev,
      tariffTypes: prev.tariffTypes.map(t => {
        if (t.id !== id) return t
        const cp = { ...t.categoryPercents }
        prev.categories.forEach(c => { cp[c.id] = t.defaultPercent })
        return { ...t, categoryPercents: cp }
      }),
    }))
  }

  function addTariff() {
    update(prev => ({
      ...prev,
      tariffTypes: [
        ...(prev.tariffTypes || []),
        {
          id: uid('tt'),
          name: 'Nuevo tarifario',
          defaultPercent: 0,
          categoryPercents: Object.fromEntries(prev.categories.map(c => [c.id, 0])),
          includedCategoryIds: prev.categories.map(c => c.id),
          usd: { enabled: false, rate: null, rateDate: '' },
        },
      ],
    }))
  }

  function removeTariff(id) {
    if (!confirm('¿Eliminar este tarifario? Esto no borra el mostrador, solo esta variante.')) return
    update(prev => ({ ...prev, tariffTypes: prev.tariffTypes.filter(t => t.id !== id) }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-copahue-green">Otros tarifarios</h2>
        <p className="text-sm text-copahue-black/60 mt-1">
          Variantes calculadas a partir de la tarifa mostrador (por ejemplo Otas o UNNOBA): se le aplica un % de
          aumento o descuento — igual para todas las categorías o distinto por categoría — y se puede elegir qué
          categorías participan. Desde <strong>Imprimir / PDF</strong> elegís cuáles incluir en la hoja.
        </p>
      </div>

      <div className="space-y-6">
        {tariffTypes.map(t => (
          <TariffCard
            key={t.id}
            tariff={t}
            categories={data.categories}
            onUpdate={patch => updateTariff(t.id, patch)}
            onUpdateUsd={patch => updateUsd(t.id, patch)}
            onSetCategoryPercent={(catId, value) => setCategoryPercent(t.id, catId, value)}
            onToggleCategory={catId => toggleCategoryIncluded(t.id, catId)}
            onApplyDefaultToAll={() => applyDefaultToAll(t.id)}
            onRemove={() => removeTariff(t.id)}
          />
        ))}
        {tariffTypes.length === 0 && (
          <p className="text-sm text-copahue-black/40 italic">Todavía no creaste ningún tarifario adicional.</p>
        )}
      </div>

      <button
        onClick={addTariff}
        className="bg-copahue-gold text-copahue-black rounded px-4 py-2 text-sm font-semibold hover:bg-copahue-gold-light"
      >
        + Nuevo tarifario
      </button>
    </div>
  )
}

function TariffCard({ tariff, categories, onUpdate, onUpdateUsd, onSetCategoryPercent, onToggleCategory, onApplyDefaultToAll, onRemove }) {
  const included = tariff.includedCategoryIds || categories.map(c => c.id)
  const percentLabel = Number(tariff.defaultPercent) >= 0 ? 'aumento' : 'descuento'

  return (
    <div className="bg-white border border-copahue-black/10 rounded-lg overflow-hidden">
      <div className="bg-copahue-green px-4 py-3 flex flex-wrap items-center gap-3">
        <input
          className="font-display text-lg bg-transparent text-copahue-gold-light border-b border-copahue-gold-light/40 focus:outline-none focus:border-copahue-gold-light px-0.5 min-w-0"
          value={tariff.name}
          onChange={e => onUpdate({ name: e.target.value })}
        />
        <button onClick={onRemove} className="ml-auto text-xs px-2 py-1 rounded border border-red-300 text-red-200 hover:bg-red-500/20">
          Eliminar tarifario
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-copahue-black/60 mb-1">% por defecto ({percentLabel})</label>
            <input
              type="number"
              className="w-24 border border-copahue-black/20 rounded px-2 py-1.5 text-sm text-right"
              value={tariff.defaultPercent}
              onChange={e => onUpdate({ defaultPercent: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </div>
          <button
            onClick={onApplyDefaultToAll}
            className="text-xs px-3 py-2 rounded border border-copahue-gold text-copahue-gold-dark hover:bg-copahue-gold/10"
          >
            Aplicar este % a todas las categorías
          </button>
          <p className="text-xs text-copahue-black/40 max-w-xs">
            Usá números negativos para descuento (ej. -10) y positivos para aumento (ej. 20). Podés ajustar cada
            categoría individualmente abajo.
          </p>
        </div>

        <div className="border border-copahue-black/10 rounded-md p-3 bg-copahue-cream/40">
          <label className="flex items-center gap-2 text-sm font-medium text-copahue-black/70">
            <input
              type="checkbox"
              checked={!!tariff.usd?.enabled}
              onChange={e => onUpdateUsd({ enabled: e.target.checked })}
              className="accent-copahue-gold-dark"
            />
            Mostrar también en dólares
          </label>
          {tariff.usd?.enabled && (
            <div className="flex flex-wrap gap-3 mt-2">
              <div>
                <label className="block text-xs text-copahue-black/50 mb-1">Cotización del dólar ($ por USD)</label>
                <input
                  type="number"
                  className="w-32 border border-copahue-black/20 rounded px-2 py-1.5 text-sm text-right"
                  value={tariff.usd?.rate ?? ''}
                  onChange={e => onUpdateUsd({ rate: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Ej: 1200"
                />
              </div>
              <div>
                <label className="block text-xs text-copahue-black/50 mb-1">Actualizada el</label>
                <input
                  type="date"
                  className="border border-copahue-black/20 rounded px-2 py-1.5 text-sm"
                  value={tariff.usd?.rateDate || ''}
                  onChange={e => onUpdateUsd({ rateDate: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {CAPACITY_GROUPS.map(group => {
            const cats = categories.filter(c => c.group === group.id && c.active)
            if (cats.length === 0) return null
            return (
              <div key={group.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-copahue-black/40 mb-1.5">{group.label}</p>
                <ul className="divide-y divide-copahue-black/5 border border-copahue-black/10 rounded-md overflow-hidden">
                  {cats.map(c => {
                    const isIncluded = included.includes(c.id)
                    const pct = tariff.categoryPercents?.[c.id] ?? tariff.defaultPercent
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                        <label className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() => onToggleCategory(c.id)}
                            className="accent-copahue-gold-dark shrink-0"
                          />
                          <span className={`truncate ${isIncluded ? 'text-copahue-black' : 'text-copahue-black/35'}`}>{c.name}</span>
                        </label>
                        <input
                          type="number"
                          disabled={!isIncluded}
                          className="w-20 border border-copahue-black/20 rounded px-2 py-1 text-sm text-right disabled:opacity-40 disabled:bg-copahue-black/5"
                          value={pct}
                          onChange={e => onSetCategoryPercent(c.id, e.target.value === '' ? '' : Number(e.target.value))}
                        />
                        <span className="text-copahue-black/40 text-xs w-3">%</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
