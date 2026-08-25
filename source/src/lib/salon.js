// Lógica del Salón de eventos: por defecto, el precio de 4hs o menos toma el
// valor vigente de la categoría "Doble Standard" (matrimonial) y el de 5hs o
// más toma el de "Cuádruple Standard", para el mes correspondiente. Ambas
// referencias son configurables (data.salonConfig) y cada mes puede además
// pisar el valor a mano.
import { getBaseRate } from './calc'

export function getSalonPrices(data, monthId) {
  const rec = data.salon.find(s => s.monthId === monthId)
  const cfg = data.salonConfig || {}
  const ref4h = data.categories.find(c => c.id === cfg.ref4hCategoryId) || null
  const ref5h = data.categories.find(c => c.id === cfg.ref5hCategoryId) || null
  const auto4h = cfg.ref4hCategoryId ? getBaseRate(data.monthlyRates, monthId, cfg.ref4hCategoryId) : null
  const auto5h = cfg.ref5hCategoryId ? getBaseRate(data.monthlyRates, monthId, cfg.ref5hCategoryId) : null
  const price4hManual = !!rec?.price4hManual
  const price5hManual = !!rec?.price5hManual
  return {
    price4h: price4hManual ? (rec?.price4h ?? null) : auto4h,
    price5h: price5hManual ? (rec?.price5h ?? null) : auto5h,
    auto4h,
    auto5h,
    ref4h,
    ref5h,
    price4hManual,
    price5hManual,
    comments: rec?.comments || '',
  }
}

export function findCategoryByGroupAndName(categories, group, name) {
  return categories.find(c => c.group === group && c.name.toLowerCase() === name.toLowerCase())
}
