import React, { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useData } from '../lib/DataContext.jsx'
import { CAPACITY_GROUPS, compareMonths, monthLabel, formatARS, formatUSD, isMonthExpired, FIXED_DISCOUNT_PERCENT } from '../lib/constants'
import { getBaseRate, applyIncrease, calcOtaPesos, calcOtaUsd } from '../lib/calc'
import { getSalonPrices } from '../lib/salon'

// Dos columnas independientes (izquierda/derecha) para que cada una fluya
// según su propio contenido: si un cuadro es más bajo que su vecino, el
// siguiente cuadro de esa misma columna sube y ocupa el espacio libre, en
// vez de quedar atado a la altura de la fila del cuadro más alto.
const LEFT_GROUPS = CAPACITY_GROUPS.filter((_, i) => i % 2 === 0)
const RIGHT_GROUPS = CAPACITY_GROUPS.filter((_, i) => i % 2 === 1)

const MOSTRADOR_ID = '__mostrador__'

export default function ImprimirPage() {
  const { data } = useData()
  const allMonths = useMemo(() => [...data.months].sort(compareMonths), [data.months])
  const vigentMonths = useMemo(() => allMonths.filter(m => !isMonthExpired(m)), [allMonths])
  const [selectedMonths, setSelectedMonths] = useState(() => vigentMonths)
  const [includeSalon, setIncludeSalon] = useState(false)
  const [includeFotos, setIncludeFotos] = useState(false)
  const [selectedTariffIds, setSelectedTariffIds] = useState([MOSTRADOR_ID])
  const pageRefs = useRef({})
  const [downloading, setDownloading] = useState(false)

  const monthsToRender = vigentMonths.filter(m => selectedMonths.includes(m))
  const activeVars = (data.increaseVariables || []).filter(v => v.active)
  const fotos = data.fotos
  const tariffTypes = data.tariffTypes || []

  const pagesToRender = useMemo(() => {
    const list = []
    if (selectedTariffIds.includes(MOSTRADOR_ID)) {
      monthsToRender.forEach(m => list.push({ key: `mostrador_${m}`, kind: 'mostrador', monthId: m }))
    }
    tariffTypes.forEach(t => {
      if (!selectedTariffIds.includes(t.id)) return
      monthsToRender.forEach(m => list.push({ key: `${t.id}_${m}`, kind: 'tariff', monthId: m, tariff: t }))
    })
    return list
  }, [selectedTariffIds, monthsToRender, tariffTypes])

  function toggleMonth(m) {
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  function selectAll() { setSelectedMonths(vigentMonths) }
  function selectNone() { setSelectedMonths([]) }

  function toggleTariff(id) {
    setSelectedTariffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function downloadPdf() {
    if (pagesToRender.length === 0) return
    setDownloading(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const TOLERANCE_MM = 2 // evita una página extra casi en blanco por redondeo
      let started = false
      for (const p of pagesToRender) {
        const el = pageRefs.current[p.key]
        if (!el) continue
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
        // JPEG con calidad alta: el contenido es mayormente texto/colores planos,
        // así que comprime muchísimo mejor que PNG sin pérdida visible, y evita
        // generar archivos enormes al exportar varios meses juntos.
        const imgData = canvas.toDataURL('image/jpeg', 0.92)
        const imgWidth = pageWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0
        if (started) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        started = true
        heightLeft -= pageHeight
        while (heightLeft > TOLERANCE_MM) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
      }
      const rangeLabel = monthsToRender.length > 1
        ? `${monthsToRender[0]}_a_${monthsToRender[monthsToRender.length - 1]}`
        : monthsToRender[0]
      pdf.save(`Tarifario_Copahue_${rangeLabel}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <h2 className="font-display text-2xl text-copahue-green">Imprimir / Descargar PDF</h2>
          <p className="text-sm text-copahue-black/60 mt-1">Hoja A4 lista para mostrador o para enviar por mail.</p>
        </div>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="border border-copahue-black/15 rounded-md p-2.5 min-w-[200px]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-copahue-black/50">Meses a incluir</label>
              <div className="flex gap-2 text-[10px]">
                <button onClick={selectAll} className="text-copahue-gold-dark hover:underline">Todos</button>
                <button onClick={selectNone} className="text-copahue-black/40 hover:underline">Ninguno</button>
              </div>
            </div>
            <div className="max-h-32 overflow-auto space-y-0.5 pr-1">
              {vigentMonths.map(m => (
                <label key={m} className="flex items-center gap-1.5 text-xs text-copahue-black/70">
                  <input type="checkbox" checked={selectedMonths.includes(m)} onChange={() => toggleMonth(m)} className="accent-copahue-gold-dark" />
                  {monthLabel(m)}
                </label>
              ))}
              {vigentMonths.length === 0 && <p className="text-xs text-copahue-black/40 italic">No hay meses vigentes.</p>}
            </div>
          </div>
          <div className="border border-copahue-black/15 rounded-md p-2.5 min-w-[160px]">
            <label className="block text-xs text-copahue-black/50 mb-1.5">Tarifarios a incluir</label>
            <div className="max-h-32 overflow-auto space-y-0.5 pr-1">
              <label className="flex items-center gap-1.5 text-xs text-copahue-black/70">
                <input type="checkbox" checked={selectedTariffIds.includes(MOSTRADOR_ID)} onChange={() => toggleTariff(MOSTRADOR_ID)} className="accent-copahue-gold-dark" />
                Mostrador
              </label>
              {tariffTypes.map(t => (
                <label key={t.id} className="flex items-center gap-1.5 text-xs text-copahue-black/70">
                  <input type="checkbox" checked={selectedTariffIds.includes(t.id)} onChange={() => toggleTariff(t.id)} className="accent-copahue-gold-dark" />
                  {t.name}
                </label>
              ))}
              {tariffTypes.length === 0 && <p className="text-xs text-copahue-black/40 italic">No hay otros tarifarios creados.</p>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-copahue-black/60">
              <input type="checkbox" checked={includeSalon} onChange={e => setIncludeSalon(e.target.checked)} className="accent-copahue-gold-dark" />
              Incluir salón de eventos
            </label>
            <label className="flex items-center gap-1.5 text-xs text-copahue-black/60">
              <input type="checkbox" checked={includeFotos} onChange={e => setIncludeFotos(e.target.checked)} className="accent-copahue-gold-dark" />
              Incluir fotos
            </label>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 rounded bg-copahue-green text-white text-sm font-medium hover:bg-copahue-green-dark">
              Imprimir
            </button>
            <button onClick={downloadPdf} disabled={downloading || pagesToRender.length === 0} className="px-4 py-2 rounded bg-copahue-gold text-copahue-black text-sm font-semibold hover:bg-copahue-gold-light disabled:opacity-50">
              {downloading ? 'Generando…' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      </div>

      {pagesToRender.length === 0 ? (
        <p className="text-copahue-black/50 italic no-print">Seleccioná al menos un mes y un tarifario para ver la vista previa.</p>
      ) : (
        <div id="print-area" className="overflow-auto border border-copahue-black/10 rounded-lg bg-copahue-black/5 p-4 flex flex-col items-center gap-4">
          {pagesToRender.map((p, idx) => (
            <div
              key={p.key}
              ref={el => { pageRefs.current[p.key] = el }}
              className={`bg-white shadow-lg ${idx < pagesToRender.length - 1 ? 'break-after-page' : ''}`}
              style={{ width: '210mm', minHeight: '297mm', padding: '10mm', boxSizing: 'border-box' }}
            >
              {p.kind === 'mostrador' ? (
                <>
                  <PrintHeader monthId={p.monthId} />
                  <div className="flex gap-4 mt-5 items-start">
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                      {LEFT_GROUPS.map(group => (
                        <CapacityBox key={group.id} group={group} monthId={p.monthId} data={data} activeVars={activeVars} />
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                      {RIGHT_GROUPS.map(group => (
                        <CapacityBox key={group.id} group={group} monthId={p.monthId} data={data} activeVars={activeVars} />
                      ))}
                    </div>
                  </div>
                  <PrintExtras data={data} monthId={p.monthId} includeSalon={includeSalon} includeFotos={includeFotos} fotos={fotos} />
                  <p className="text-center text-[9px] text-print-ink-40 mt-4">Hotel Copahue · Tarifario válido para {monthLabel(p.monthId)} · Precios expresados en pesos argentinos</p>
                </>
              ) : (
                <>
                  <PrintHeader monthId={p.monthId} tariffName={p.tariff.name} usd={p.tariff.usd} />
                  <div className="flex gap-4 mt-5 items-start">
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                      {LEFT_GROUPS.map(group => (
                        <TariffCapacityBox key={group.id} group={group} monthId={p.monthId} data={data} tariff={p.tariff} />
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                      {RIGHT_GROUPS.map(group => (
                        <TariffCapacityBox key={group.id} group={group} monthId={p.monthId} data={data} tariff={p.tariff} />
                      ))}
                    </div>
                  </div>
                  <p className="text-center text-[9px] text-print-ink-40 mt-4">
                    Hotel Copahue · Tarifario {p.tariff.name} válido para {monthLabel(p.monthId)} · Precios expresados en pesos argentinos
                    {p.tariff.usd?.enabled && p.tariff.usd?.rate ? ` · Cotización USD $${p.tariff.usd.rate}${p.tariff.usd.rateDate ? ` (actualizada ${p.tariff.usd.rateDate})` : ''}` : ''}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CapacityBox({ group, monthId, data, activeVars }) {
  const cats = data.categories.filter(c => c.group === group.id && c.active)
  if (cats.length === 0) return null
  return (
    <div className="border border-print-ink-70 rounded overflow-hidden break-inside-avoid">
      <div className="bg-copahue-green text-copahue-gold-light font-display font-bold text-center text-[13px] py-1 tracking-wide">
        {group.label.toUpperCase()}
      </div>
      <div className="divide-y divide-print-divider-strong">
        {cats.map(c => {
          const base = getBaseRate(data.monthlyRates, monthId, c.id)
          const overrides = data.dayOverrides.filter(o => o.categoryId === c.id && (o.monthId === 'ALL' || o.monthId === monthId))
          return (
            <div key={c.id} className="px-2.5 py-1.5 bg-print-row-tint">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
                <div className="min-w-0">
                  <p className="font-extrabold text-[14px] leading-tight text-copahue-black break-words tracking-tight">{c.name}</p>
                  {c.rooms && <p className="text-[8px] italic text-print-ink-50 leading-tight">{c.rooms}</p>}
                  {overrides.map(o => (
                    <p key={o.id} className="text-[8px] italic text-copahue-gold-dark leading-tight mt-0.5">
                      {o.label || 'Excepción'}
                    </p>
                  ))}
                </div>
                <div className="text-center">
                  <p className="font-display font-extrabold text-[16px] text-copahue-green leading-none price-figure whitespace-nowrap">{formatARS(base)}</p>
                  {overrides.map(o => (
                    <p key={o.id} className="font-display font-extrabold text-[12px] italic text-copahue-green leading-none price-figure mt-0.5 whitespace-nowrap">
                      {formatARS(o.mode === 'fixed' ? o.value : applyIncrease(base, o.value))}
                    </p>
                  ))}
                </div>
                <div className="text-right pl-1">
                  {activeVars.map(v => (
                    <p key={v.id} className="text-[8px] italic text-print-ink-40 leading-tight price-figure">
                      <span className="not-italic">+{v.percent}%</span> {formatARS(applyIncrease(base, v.percent))}
                    </p>
                  ))}
                  <p className="inline-block text-[10px] font-extrabold not-italic text-copahue-black bg-print-gold-20 leading-tight price-figure mt-1 px-1.5 py-0.5 rounded">
                    -{FIXED_DISCOUNT_PERCENT}% {formatARS(applyIncrease(base, -FIXED_DISCOUNT_PERCENT))}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Igual que CapacityBox, pero para una variante de tarifario (Otas, UNNOBA, etc.):
// solo muestra las categorías incluidas en esa variante, con el % propio de cada
// una (o el % por defecto del tarifario) aplicado sobre el precio mostrador, y
// opcionalmente su conversión a dólares.
function TariffCapacityBox({ group, monthId, data, tariff }) {
  const included = tariff.includedCategoryIds || data.categories.map(c => c.id)
  const cats = data.categories.filter(c => c.group === group.id && c.active && included.includes(c.id))
  if (cats.length === 0) return null
  return (
    <div className="border border-print-ink-70 rounded overflow-hidden break-inside-avoid">
      <div className="bg-copahue-green text-copahue-gold-light font-display font-bold text-center text-[13px] py-1 tracking-wide">
        {group.label.toUpperCase()}
      </div>
      <div className="divide-y divide-print-divider-strong">
        {cats.map(c => {
          const base = getBaseRate(data.monthlyRates, monthId, c.id)
          const pct = tariff.categoryPercents?.[c.id] ?? tariff.defaultPercent
          const price = calcOtaPesos(base, pct)
          const usdPrice = tariff.usd?.enabled && tariff.usd?.rate ? calcOtaUsd(price, tariff.usd.rate) : null
          return (
            <div key={c.id} className="px-2.5 py-1.5 bg-print-row-tint">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5">
                <div className="min-w-0">
                  <p className="font-extrabold text-[14px] leading-tight text-copahue-black break-words tracking-tight">{c.name}</p>
                  {c.rooms && <p className="text-[8px] italic text-print-ink-50 leading-tight">{c.rooms}</p>}
                </div>
                <div className="text-right">
                  <p className="font-display font-extrabold text-[16px] text-copahue-green leading-none price-figure whitespace-nowrap">{formatARS(price)}</p>
                  {usdPrice !== null && (
                    <p className="text-[11px] font-semibold text-copahue-black/60 leading-tight price-figure mt-0.5 whitespace-nowrap">{formatUSD(usdPrice)}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PrintExtras({ data, monthId, includeSalon, includeFotos, fotos }) {
  const cochera = data.cochera.find(c => c.monthId === monthId)
  const salon = includeSalon ? getSalonPrices(data, monthId) : null

  return (
    <>
      {cochera && (
        <div className="mt-3 border border-print-ink-70 rounded overflow-hidden break-inside-avoid">
          <div className="bg-copahue-green text-copahue-gold-light font-display font-bold text-center text-[13px] py-1 tracking-wide">COCHERA</div>
          <div className="flex justify-center gap-10 py-2 bg-print-row-tint">
            <span className="flex items-baseline gap-1.5">
              <strong className="text-[12px]">Autos:</strong>
              <span className="font-display font-extrabold text-[16px] text-copahue-green price-figure">{formatARS(cochera.autoPrice)}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <strong className="text-[12px]">Motos:</strong>
              <span className="font-display font-extrabold text-[16px] text-copahue-green price-figure">{formatARS(cochera.motoPrice)}</span>
            </span>
          </div>
          {cochera.comments && <p className="text-[9px] text-center text-print-ink-50 pb-1 px-2">{cochera.comments}</p>}
        </div>
      )}

      {(includeSalon || includeFotos) && (
        <div className="mt-3 grid grid-cols-2 gap-3 break-inside-avoid">
          {includeSalon && salon && (
            <div className="border border-print-ink-70 rounded overflow-hidden">
              <div className="bg-copahue-green text-copahue-gold-light font-display font-bold text-center text-[12px] py-1">SALÓN DE EVENTOS</div>
              <div className="flex justify-center gap-6 py-2 bg-print-row-tint">
                <span className="flex items-baseline gap-1.5">
                  <strong className="text-[11px]">Hasta 4hs:</strong>
                  <span className="font-display font-extrabold text-[16px] text-copahue-green price-figure">{formatARS(salon.price4h)}</span>
                </span>
                <span className="flex items-baseline gap-1.5">
                  <strong className="text-[11px]">5hs o +:</strong>
                  <span className="font-display font-extrabold text-[16px] text-copahue-green price-figure">{formatARS(salon.price5h)}</span>
                </span>
              </div>
              {salon.comments && <p className="text-[8px] text-center text-print-ink-50 pb-1 px-2">{salon.comments}</p>}
            </div>
          )}
          {includeFotos && fotos && fotos.active && (
            <div className="border border-print-ink-70 rounded overflow-hidden">
              <div className="bg-copahue-green text-copahue-gold-light font-display font-bold text-center text-[12px] py-1">FOTOS</div>
              <div className="text-center py-2 bg-print-row-tint font-display font-extrabold text-[16px] text-copahue-green price-figure">
                {formatARS(fotos.price)} <span className="text-[11px] font-sans font-normal text-copahue-black/60">+ IVA</span>
              </div>
              {fotos.comments && <p className="text-[8px] text-center text-print-ink-50 pb-1 px-2">{fotos.comments}</p>}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function PrintHeader({ monthId, tariffName, usd }) {
  return (
    <div className="text-center">
      {tariffName && (
        <p className="text-[10px] tracking-[0.3em] text-print-ink-50 uppercase">{tariffName}</p>
      )}
      <h1 className="font-display font-extrabold text-5xl text-copahue-black uppercase tracking-wide">{monthLabel(monthId)}</h1>
      {usd?.enabled && usd?.rate ? (
        <p className="text-[9px] text-print-ink-50 mt-1">Cotización USD: ${usd.rate}{usd.rateDate ? ` (actualizada ${usd.rateDate})` : ''}</p>
      ) : null}
    </div>
  )
}
