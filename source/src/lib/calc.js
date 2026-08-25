// Lógica de cálculo de precios: aumentos, excepciones por día de semana, OTAs y contratos.

// Devuelve el precio base (mostrador) de una categoría en un mes, o null si no está cargado.
export function getBaseRate(monthlyRates, monthId, categoryId) {
  const rec = monthlyRates.find(r => r.monthId === monthId && r.categoryId === categoryId)
  if (!rec || rec.basePrice === null || rec.basePrice === undefined || rec.basePrice === '') return null
  return Number(rec.basePrice)
}

// Calcula el precio final de una categoría/mes para un día de semana determinado (0=Domingo..6=Sábado),
// aplicando la primera excepción de día que corresponda (manual, %, o tomada de otra categoría).
export function getEffectivePrice({ categories, monthlyRates, dayOverrides }, monthId, categoryId, weekday) {
  const base = getBaseRate(monthlyRates, monthId, categoryId)
  if (weekday === undefined || weekday === null) {
    return { price: base, override: null }
  }
  const applicable = dayOverrides.filter(o =>
    o.categoryId === categoryId &&
    (o.monthId === 'ALL' || o.monthId === monthId) &&
    Array.isArray(o.days) && o.days.includes(weekday)
  )
  if (applicable.length === 0) return { price: base, override: null }
  const ov = applicable[0]
  let price = base
  if (ov.mode === 'fixed') {
    price = Number(ov.value)
  } else if (ov.mode === 'percent') {
    if (base === null) price = null
    else price = round5(base * (1 + Number(ov.value) / 100))
  } else if (ov.mode === 'fromCategory') {
    const refBase = getBaseRate(monthlyRates, monthId, ov.refCategoryId)
    if (refBase === null) price = null
    else price = ov.value ? round5(refBase * (1 + Number(ov.value) / 100)) : refBase
  }
  return { price, override: ov }
}

// Aplica una variable de aumento (%) a un precio base, redondeando al millar
// según la regla del hotel (ver roundToThousand).
export function applyIncrease(base, percent) {
  if (base === null || base === undefined) return null
  return roundToThousand(base * (1 + Number(percent) / 100))
}

export function round5(n) {
  return Math.round(n / 5) * 5
}

// Redondeo de aumentos al millar: el resto hasta 399 redondea para abajo,
// desde 400 redondea para arriba. Ej: 19340 -> 19000, 19400 -> 20000.
export function roundToThousand(n) {
  if (n === null || n === undefined) return null
  const thousands = Math.floor(n / 1000)
  const remainder = n - thousands * 1000
  return remainder < 400 ? thousands * 1000 : (thousands + 1) * 1000
}

export function round(n) {
  return Math.round(n)
}

// ---- OTA ----
// Dado un precio mostrador, calcula el precio OTA en pesos (aplicando % propio de la OTA)
// y su conversión a dólares usando la cotización vigente.
export function calcOtaPesos(mostradorPrice, otaPercent) {
  if (mostradorPrice === null || mostradorPrice === undefined) return null
  return round5(mostradorPrice * (1 + Number(otaPercent) / 100))
}

export function calcOtaUsd(otaPesos, exchangeRate) {
  if (otaPesos === null || !exchangeRate) return null
  return Math.round(otaPesos / Number(exchangeRate))
}

// Recargos adicionales visibles de forma poco notoria (5/10/15/20%) sobre un importe ya confirmado.
export const OTA_EXTRA_MARKUPS = [5, 10, 15, 20]

export function calcExtraMarkups(amount) {
  if (amount === null || amount === undefined || amount === '') return OTA_EXTRA_MARKUPS.map(() => null)
  return OTA_EXTRA_MARKUPS.map(p => round(Number(amount) * (1 + p / 100)))
}

// ---- Contratos ----
// Precio de un contrato para una categoría/mes: si baseMode es 'percent', parte del mostrador
// del mes y aplica el % (global o específico de la categoría). Si es 'manual', usa el precio cargado.
export function calcContractPrice({ baseMode, mostradorPrice, percent, manualPrice }) {
  if (baseMode === 'manual') {
    return manualPrice === null || manualPrice === undefined || manualPrice === '' ? null : Number(manualPrice)
  }
  if (mostradorPrice === null || mostradorPrice === undefined) return null
  return round5(mostradorPrice * (1 + Number(percent || 0) / 100))
}
