import React, { useMemo, useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { CAPACITY_GROUPS, compareMonths, monthLabel, uid } from '../lib/constants'
import { getSalonPrices } from '../lib/salon'

export default function ExtrasPage() {
  const { data, update } = useData()
  const months = useMemo(() => [...data.months].sort(compareMonths), [data.months])
  const [monthId, setMonthId] = useState(months[0] || '')
  const activeMonth = months.includes(monthId) ? monthId : months[0]

  const cochera = data.cochera.find(c => c.monthId === activeMonth) || { monthId: activeMonth, autoPrice: '', motoPrice: '', comments: '' }
  const salonPrices = getSalonPrices(data, activeMonth)
  const salonRec = data.salon.find(s => s.monthId === activeMonth)
  const fotos = data.fotos || { price: '', comments: '', active: true }

  function updateCochera(patch) {
    update(prev => {
      const exists = prev.cochera.some(c => c.monthId === activeMonth)
      const cochera = exists
        ? prev.cochera.map(c => c.monthId === activeMonth ? { ...c, ...patch } : c)
        : [...prev.cochera, { id: uid('coch'), monthId: activeMonth, autoPrice: '', motoPrice: '', comments: '', ...patch }]
      return { ...prev, cochera }
    })
  }

  function updateSalon(patch) {
    update(prev => {
      const exists = prev.salon.some(s => s.monthId === activeMonth)
      const salon = exists
        ? prev.salon.map(s => s.monthId === activeMonth ? { ...s, ...patch } : s)
        : [...prev.salon, { id: uid('sal'), monthId: activeMonth, price4h: null, price5h: null, price4hManual: false, price5hManual: false, comments: '', ...patch }]
      return { ...prev, salon }
    })
  }

  function updateSalonConfig(patch) {
    update(prev => ({ ...prev, salonConfig: { ...prev.salonConfig, ...patch } }))
  }

  function updateFotos(patch) {
    update(prev => ({ ...prev, fotos: { ...prev.fotos, ...patch } }))
  }

  const salonCategoryOptions = CAPACITY_GROUPS.flatMap(g =>
    data.categories.filter(c => c.group === g.id).map(c => ({ ...c, groupLabel: g.label }))
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-copahue-green">Cochera, Salón y Fotos</h2>
          <p className="text-sm text-copahue-black/60 mt-1">Exclusivo de la tarifa mostrador.</p>
        </div>
        <div>
          <label className="block text-xs text-copahue-black/50 mb-1">Mes</label>
          <select value={activeMonth || ''} onChange={e => setMonthId(e.target.value)} className="border border-copahue-black/20 rounded px-3 py-1.5 text-sm min-w-[160px]">
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      <section className="bg-white border border-copahue-black/10 rounded-lg p-4">
        <h3 className="font-display text-lg text-copahue-green mb-3">Cochera</h3>
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
          <Field label="Autos">
            <PriceInput value={cochera.autoPrice} onChange={v => updateCochera({ autoPrice: v })} />
          </Field>
          <Field label="Motos">
            <PriceInput value={cochera.motoPrice} onChange={v => updateCochera({ motoPrice: v })} />
          </Field>
        </div>
        <CommentsField value={cochera.comments} onChange={v => updateCochera({ comments: v })} />
      </section>

      <section className="bg-white border border-copahue-black/10 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h3 className="font-display text-lg text-copahue-green">Alquiler de salón de eventos</h3>
        </div>
        <p className="text-xs text-copahue-black/50 mb-3">
          Por defecto el precio se toma automáticamente de otra categoría de la tarifa mostrador para el mismo mes. Podés cambiar de qué categoría se toma, o pisar el valor a mano para un mes puntual.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <SalonTierField
            label="Hasta 4 hs"
            refCategoryId={data.salonConfig?.ref4hCategoryId || ''}
            onRefChange={v => updateSalonConfig({ ref4hCategoryId: v || null })}
            options={salonCategoryOptions}
            autoValue={salonPrices.auto4h}
            manual={salonPrices.price4hManual}
            manualValue={salonRec?.price4h}
            onToggleManual={manual => updateSalon(manual
              ? { price4hManual: true, price4h: salonPrices.auto4h ?? 0 }
              : { price4hManual: false, price4h: null })}
            onManualValueChange={v => updateSalon({ price4h: v })}
          />
          <SalonTierField
            label="5 hs o más"
            refCategoryId={data.salonConfig?.ref5hCategoryId || ''}
            onRefChange={v => updateSalonConfig({ ref5hCategoryId: v || null })}
            options={salonCategoryOptions}
            autoValue={salonPrices.auto5h}
            manual={salonPrices.price5hManual}
            manualValue={salonRec?.price5h}
            onToggleManual={manual => updateSalon(manual
              ? { price5hManual: true, price5h: salonPrices.auto5h ?? 0 }
              : { price5hManual: false, price5h: null })}
            onManualValueChange={v => updateSalon({ price5h: v })}
          />
        </div>
        <CommentsField value={salonRec?.comments} onChange={v => updateSalon({ comments: v })} placeholder="Ej: servicios incluidos, condiciones, descuentos VIP…" />
      </section>

      <section className="bg-white border border-copahue-black/10 rounded-lg p-4">
        <h3 className="font-display text-lg text-copahue-green mb-3">Sesión de fotos</h3>
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg items-end">
          <Field label="Precio">
            <PriceInput value={fotos.price} onChange={v => updateFotos({ price: v })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-copahue-black/70 mb-2">
            <input type="checkbox" checked={!!fotos.active} onChange={e => updateFotos({ active: e.target.checked })} className="accent-copahue-gold-dark" />
            Mostrar en la impresión
          </label>
        </div>
        <CommentsField value={fotos.comments} onChange={v => updateFotos({ comments: v })} placeholder="Ej: días y horarios, duración, condiciones…" />
      </section>
    </div>
  )
}

function SalonTierField({ label, refCategoryId, onRefChange, options, autoValue, manual, manualValue, onToggleManual, onManualValueChange }) {
  return (
    <div className="border border-copahue-black/10 rounded-md p-3">
      <p className="text-xs font-medium text-copahue-black/60 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-copahue-black/45 text-sm price-figure">$</span>
        {manual ? (
          <input
            type="number"
            value={manualValue === null || manualValue === undefined ? '' : manualValue}
            onChange={e => onManualValueChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-32 text-left price-figure text-lg font-bold text-copahue-green border-b-2 border-copahue-gold/50 focus:border-copahue-gold focus:outline-none bg-transparent"
          />
        ) : (
          <span className="text-left price-figure text-lg font-bold text-copahue-green">
            {autoValue === null || autoValue === undefined ? '—' : autoValue.toLocaleString('es-AR')}
          </span>
        )}
      </div>
      <label className="flex items-center gap-1.5 text-[11px] text-copahue-black/50 mt-1.5">
        <input type="checkbox" checked={manual} onChange={e => onToggleManual(e.target.checked)} className="accent-copahue-gold-dark" />
        Editar manualmente este mes
      </label>
      {!manual && (
        <div className="mt-2">
          <label className="block text-[11px] text-copahue-black/50 mb-0.5">Tomar precio de la categoría:</label>
          <select value={refCategoryId} onChange={e => onRefChange(e.target.value)} className="w-full border border-copahue-black/20 rounded px-2 py-1 text-xs">
            <option value="">— elegir categoría —</option>
            {options.map(c => (
              <option key={c.id} value={c.id}>{c.groupLabel} · {c.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-copahue-black/60 mb-1">{label}</label>
      {children}
    </div>
  )
}

function PriceInput({ value, onChange }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-copahue-black/45 text-sm price-figure">$</span>
      <input
        type="number"
        value={value === null || value === undefined ? '' : value}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full text-left price-figure text-lg font-bold text-copahue-green border-b-2 border-copahue-gold/50 focus:border-copahue-gold focus:outline-none bg-transparent"
        placeholder="—"
      />
    </div>
  )
}

function CommentsField({ value, onChange, placeholder }) {
  return (
    <div className="mt-3">
      <label className="block text-xs font-medium text-copahue-black/60 mb-1">Comentarios / detalles / condiciones <span className="font-normal">(opcional)</span></label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full border border-copahue-black/20 rounded px-3 py-2 text-sm"
      />
    </div>
  )
}
