import React, { useMemo } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { CAPACITY_GROUPS, compareMonths, monthLabel, formatARS, isMonthExpired } from '../lib/constants'
import { getBaseRate } from '../lib/calc'

// Aglomera automáticamente todas las tarifas de meses ya finalizados, a modo
// de registro histórico. Es de solo lectura: para editar un mes hay que
// volver a agregarlo desde Tarifas.
export default function VencidasPage() {
  const { data } = useData()
  const expiredMonths = useMemo(
    () => [...data.months].filter(m => isMonthExpired(m)).sort(compareMonths).reverse(),
    [data.months]
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-copahue-green">Tarifas vencidas</h2>
        <p className="text-sm text-copahue-black/60 mt-1">
          Registro histórico de meses ya finalizados. Se archivan automáticamente acá al terminar el mes.
        </p>
      </div>

      {expiredMonths.length === 0 ? (
        <p className="text-copahue-black/50 italic">Todavía no hay meses vencidos.</p>
      ) : (
        <div className="space-y-6">
          {expiredMonths.map(monthId => (
            <details key={monthId} className="bg-white border border-copahue-black/10 rounded-lg overflow-hidden">
              <summary className="cursor-pointer select-none bg-copahue-black/5 px-4 py-2.5 font-display text-copahue-black/70">
                {monthLabel(monthId)}
              </summary>
              <div className="p-4 grid md:grid-cols-2 gap-4">
                {CAPACITY_GROUPS.map(group => {
                  const cats = data.categories.filter(c => c.group === group.id)
                  if (cats.length === 0) return null
                  return (
                    <div key={group.id} className="border border-copahue-black/10 rounded-md overflow-hidden">
                      <div className="bg-copahue-black/80 text-copahue-gold-light font-display text-sm px-3 py-1.5">
                        {group.label}
                      </div>
                      <ul className="divide-y divide-copahue-black/5">
                        {cats.map(c => {
                          const base = getBaseRate(data.monthlyRates, monthId, c.id)
                          return (
                            <li key={c.id} className="px-3 py-1.5 flex items-center justify-between gap-2 text-sm">
                              <span className="text-copahue-black/70">{c.name}</span>
                              <span className="price-figure font-semibold text-copahue-black/60">{formatARS(base)}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
