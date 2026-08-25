// Constantes generales del tarifario Hotel Copahue

export const CAPACITY_GROUPS = [
  { id: 'single', label: 'Single' },
  { id: 'doble', label: 'Doble' },
  { id: 'triple', label: 'Triple' },
  { id: 'doble_twin', label: 'Doble Twin' },
  { id: 'quintuple', label: 'Quíntuple' },
  { id: 'cuadruple', label: 'Cuádruple' },
]

// Descuento fijo (no editable) que se muestra en el tarifario impreso, debajo
// de las variables de aumento. Siempre se calcula sobre el precio base fijo
// de la categoría (nunca sobre un precio de excepción/día).
export const FIXED_DISCOUNT_PERCENT = 15

export const CAPACITY_LABEL = Object.fromEntries(CAPACITY_GROUPS.map(g => [g.id, g.label]))

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const DAYS_OF_WEEK = [
  { id: 0, short: 'Dom', label: 'Domingo' },
  { id: 1, short: 'Lun', label: 'Lunes' },
  { id: 2, short: 'Mar', label: 'Martes' },
  { id: 3, short: 'Mié', label: 'Miércoles' },
  { id: 4, short: 'Jue', label: 'Jueves' },
  { id: 5, short: 'Vie', label: 'Viernes' },
  { id: 6, short: 'Sáb', label: 'Sábado' },
]

// monthId formato 'YYYY-MM'
export function monthLabel(monthId) {
  if (!monthId) return ''
  const [y, m] = monthId.split('-').map(Number)
  return `${MONTH_NAMES_ES[m - 1]} ${y}`
}

export function monthShortLabel(monthId) {
  if (!monthId) return ''
  const [y, m] = monthId.split('-').map(Number)
  return `${MONTH_NAMES_ES[m - 1].slice(0, 3)} ${y}`
}

export function addMonths(monthId, n) {
  const [y, m] = monthId.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function compareMonths(a, b) {
  return a.localeCompare(b)
}

export function currentMonthId(refDate) {
  const d = refDate || new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Un mes se considera "vencido" cuando ya terminó (es anterior al mes en curso).
export function isMonthExpired(monthId, refDate) {
  if (!monthId) return false
  return compareMonths(monthId, currentMonthId(refDate)) < 0
}

// Siempre incluye el símbolo "$", incluso cuando todavía no hay precio cargado.
export function formatARS(n) {
  if (n === null || n === undefined || n === '') return '$ —'
  const num = Number(n)
  if (Number.isNaN(num)) return '$ —'
  return '$' + num.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export function formatUSD(n) {
  if (n === null || n === undefined || n === '') return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return 'USD ' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export const OVERRIDE_MODES = [
  { id: 'percent', label: '% sobre tarifa base' },
  { id: 'fixed', label: 'Precio fijo manual' },
  { id: 'fromCategory', label: 'Tomar precio de otra categoría' },
]

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
