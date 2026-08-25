// Cliente Firebase dinámico: se inicializa en tiempo de ejecución con la configuración
// que el usuario pega en la pantalla de Configuración (guardada en localStorage).
// Si no hay configuración guardada, se usa por defecto el mismo proyecto Firebase
// que ya utiliza el Asistente de respuestas de recepción ("respuestas-de-whatsapp"),
// de modo que Tarifario y el Asistente comparten una única fuente de precios sin
// necesidad de configuración manual. Si tampoco eso funciona, la app sigue
// funcionando igual con almacenamiento local (localStorage).

import { initializeApp, getApps, deleteApp } from 'firebase/app'
import {
  getFirestore, doc, onSnapshot, setDoc
} from 'firebase/firestore'

const CONFIG_KEY = 'copahue_firebase_config'
// Marca explícita de "Desconectar Firebase": si está presente, se ignora el
// default y la app usa almacenamiento local aunque no haya config guardada.
const DISABLED_KEY = 'copahue_firebase_disabled'

// Config por defecto: mismo proyecto Firebase que el Asistente de respuestas.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCfNMmtXTD6xM3x8FGALYaeL7G_kT6O1kQ",
  authDomain: "respuestas-de-whatsapp.firebaseapp.com",
  projectId: "respuestas-de-whatsapp",
  storageBucket: "respuestas-de-whatsapp.firebasestorage.app",
  messagingSenderId: "761865711661",
  appId: "1:761865711661:web:1e5ba782066da82895c8a4",
}

export function getSavedFirebaseConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return JSON.parse(raw)
    if (localStorage.getItem(DISABLED_KEY) === '1') return null
  } catch {
    // ignore, fall through to default
  }
  return DEFAULT_FIREBASE_CONFIG
}

// Indica si la config activa es la que viene por defecto (proyecto compartido
// con el Asistente) en lugar de una pegada manualmente por el usuario.
export function isUsingDefaultFirebaseConfig() {
  try {
    return !localStorage.getItem(CONFIG_KEY) && localStorage.getItem(DISABLED_KEY) !== '1'
  } catch {
    return true
  }
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  localStorage.removeItem(DISABLED_KEY)
}

export function clearFirebaseConfig() {
  localStorage.removeItem(CONFIG_KEY)
  localStorage.setItem(DISABLED_KEY, '1')
}

let currentApp = null
let currentDb = null

export function getFirestoreDb() {
  const config = getSavedFirebaseConfig()
  if (!config || !config.projectId) return null
  try {
    if (currentDb) return currentDb
    const existing = getApps()
    if (existing.length) {
      existing.forEach(a => deleteApp(a).catch(() => {}))
    }
    currentApp = initializeApp(config)
    currentDb = getFirestore(currentApp)
    return currentDb
  } catch (e) {
    console.error('Error inicializando Firebase', e)
    return null
  }
}

export function resetFirestoreClient() {
  currentApp = null
  currentDb = null
}

export { doc, onSnapshot, setDoc }
