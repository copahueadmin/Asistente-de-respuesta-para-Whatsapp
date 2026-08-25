// Datos iniciales de ejemplo, tomados del cuadro tarifario vigente del Hotel Copahue
// (temporada Julio 2026 - Marzo 2027). Sirven como carga inicial / registro de referencia
// y pueden editarse libremente desde la aplicación.
import { uid } from './constants'

// ---- Categorías ----
// group: single | doble | doble_twin | triple | cuadruple | quintuple
const cat = (name, group, rooms = '') => ({ id: uid('cat'), name, group, rooms, active: true })

export function buildSeedCategories() {
  return [
    cat('Suite', 'single'),
    cat('Standard', 'single'),
    cat('Standard Mini', 'single', '1 Mat. o 2 Ind.'),
    cat('Económica', 'single'),

    cat('Suite', 'doble'),
    cat('Standard', 'doble'),
    cat('Standard Mini', 'doble', '1 Mat. o 2 Ind.'),
    cat('Económica', 'doble'),

    cat('Suite', 'doble_twin'),
    cat('Standard', 'doble_twin', '2 Mat.'),

    cat('Suite Familiar', 'triple', 'Hab. 210, 310 o 212 (con 2 mat, en ese orden)'),
    cat('Standard', 'triple'),
    cat('Económica', 'triple'),

    cat('Departamento', 'cuadruple'),
    cat('Suite Familiar', 'cuadruple', 'Hab. 212 (con 1 mat + 2 ind) o 210, 310 o 312 (en ese orden)'),
    cat('Standard', 'cuadruple'),

    cat('Departamento', 'quintuple'),
    cat('Suite Familiar', 'quintuple', 'Hab. 312 solamente'),
  ]
}

// precios base mostrador por mes (2026-07 .. 2027-03), en el mismo orden que buildSeedCategories()
const MONTHLY_PRICES = {
  '2026-07': [110000, 93000, 86000, 76000, 157000, 135000, 124000, 113000, 157000, 145000, 164000, 153000, 130000, 178000, 173000, 169000, 184000, 179000],
  '2026-08': [114000, 97000, 89000, 79000, 163000, 140000, 129000, 118000, 163000, 151000, 171000, 159000, 135000, 185000, 180000, 176000, 191000, 186000],
  '2026-09': [119000, 101000, 93000, 82000, 170000, 146000, 134000, 122000, 170000, 157000, 177000, 166000, 141000, 193000, 187000, 183000, 199000, 194000],
  '2026-10': [123000, 104000, 96000, 85000, 176000, 151000, 139000, 127000, 176000, 162000, 184000, 171000, 146000, 199000, 194000, 189000, 206000, 200000],
  '2026-11': [127000, 107000, 99000, 88000, 181000, 156000, 143000, 130000, 181000, 167000, 189000, 177000, 150000, 205000, 200000, 195000, 212000, 206000],
  '2026-12': [130000, 110000, 102000, 90000, 186000, 160000, 147000, 134000, 186000, 171000, 194000, 181000, 154000, 210000, 205000, 200000, 218000, 212000],
  '2027-01': [133000, 113000, 104000, 92000, 190000, 164000, 150000, 137000, 190000, 176000, 199000, 185000, 158000, 216000, 210000, 205000, 223000, 217000],
  '2027-02': [137000, 116000, 107000, 95000, 195000, 168000, 154000, 140000, 195000, 180000, 204000, 190000, 162000, 221000, 215000, 210000, 229000, 222000],
  '2027-03': [140000, 119000, 110000, 97000, 200000, 172000, 158000, 144000, 200000, 185000, 209000, 195000, 166000, 227000, 220000, 215000, 234000, 228000],
}

export function buildSeedMonthlyRates(categories) {
  const rates = []
  for (const [monthId, prices] of Object.entries(MONTHLY_PRICES)) {
    categories.forEach((c, i) => {
      rates.push({ id: uid('rate'), monthId, categoryId: c.id, basePrice: prices[i] })
    })
  }
  return rates
}

export function buildSeedDayOverrides(categories) {
  const suiteSingle = categories.find(c => c.group === 'single' && c.name === 'Suite')
  if (!suiteSingle) return []
  return [
    {
      id: uid('ovr'),
      categoryId: suiteSingle.id,
      monthId: 'ALL',
      days: [5, 6, 0], // Viernes, Sábado, Domingo
      mode: 'percent',
      value: -15,
      label: 'Vier. a Dom. (base doble)',
    },
  ]
}

export function buildSeedIncreaseVariables() {
  return [
    { id: uid('inc'), label: 'Aumento 20%', percent: 20, active: true },
    { id: uid('inc'), label: 'Aumento 15%', percent: 15, active: true },
    { id: uid('inc'), label: 'Aumento 10%', percent: 10, active: true },
  ]
}

const COCHERA_PRICES = {
  '2026-07': [13000, 10000], '2026-08': [13000, 10000], '2026-09': [14000, 11000],
  '2026-10': [14000, 11000], '2026-11': [15000, 12000], '2026-12': [15000, 12000],
  '2027-01': [15000, 12000], '2027-02': [16000, 13000], '2027-03': [16000, 13000],
}

export function buildSeedCochera() {
  return Object.entries(COCHERA_PRICES).map(([monthId, [auto, moto]]) => ({
    id: uid('coch'), monthId, autoPrice: auto, motoPrice: moto, comments: '',
  }))
}

// El precio del salón se calcula automáticamente a partir de otras categorías
// (ver buildSeedSalonConfig): 4hs o menos = Doble Standard, 5hs o más =
// Cuádruple Standard. Acá solo se guardan los comentarios; si algún mes
// necesita un valor manual puntual, se marca price4hManual/price5hManual.
export function buildSeedSalon() {
  return Object.keys(MONTHLY_PRICES).map(monthId => ({
    id: uid('sal'),
    monthId,
    price4h: null,
    price5h: null,
    price4hManual: false,
    price5hManual: false,
    comments: 'Por pedido y sin cargo: micrófono, anotadores y rotafolios. Tarifas finales con IVA; abonando VIP se descuenta el 15%.',
  }))
}

// Configuración base del salón: de qué categoría de la tarifa mostrador toma
// el precio para cada franja horaria.
export function buildSeedSalonConfig(categories) {
  const ref4h = categories.find(c => c.group === 'doble' && c.name === 'Standard')
  const ref5h = categories.find(c => c.group === 'cuadruple' && c.name === 'Standard')
  return {
    ref4hCategoryId: ref4h ? ref4h.id : null,
    ref5hCategoryId: ref5h ? ref5h.id : null,
  }
}

export function buildSeedFotos() {
  return {
    price: 40000,
    comments: 'Viernes, sábados y domingos de 19 a 22hs, por 40 minutos. + IVA.',
    active: true,
  }
}

// Tarifarios adicionales, calculados a partir del mostrador (ver src/lib/tariffTypes.js).
// "Otas" suma un % (aumento) y puede mostrarse también en dólares; "UNNOBA" resta un %
// (descuento) que puede variar por categoría. Los porcentajes de ejemplo quedan en 0/
// sin cargar para que el administrador los defina desde "Otros tarifarios".
export function buildSeedTariffTypes(categories) {
  return [
    {
      id: uid('tt'),
      name: 'Otas',
      defaultPercent: 20,
      categoryPercents: Object.fromEntries(categories.map(c => [c.id, 20])),
      includedCategoryIds: categories.map(c => c.id),
      usd: { enabled: true, rate: null, rateDate: '' },
    },
    {
      id: uid('tt'),
      name: 'UNNOBA',
      defaultPercent: -10,
      categoryPercents: Object.fromEntries(categories.map(c => [c.id, -10])),
      includedCategoryIds: categories.map(c => c.id),
      usd: { enabled: false, rate: null, rateDate: '' },
    },
  ]
}

export function buildFullSeed() {
  const categories = buildSeedCategories()
  return {
    categories,
    monthlyRates: buildSeedMonthlyRates(categories),
    dayOverrides: buildSeedDayOverrides(categories),
    increaseVariables: buildSeedIncreaseVariables(),
    cochera: buildSeedCochera(),
    salon: buildSeedSalon(),
    salonConfig: buildSeedSalonConfig(categories),
    fotos: buildSeedFotos(),
    months: Object.keys(MONTHLY_PRICES).sort(),
    tariffTypes: buildSeedTariffTypes(categories),
  }
}
