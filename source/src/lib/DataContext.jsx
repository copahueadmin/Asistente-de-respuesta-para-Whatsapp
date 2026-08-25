import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { getFirestoreDb, getSavedFirebaseConfig, doc, onSnapshot, setDoc } from './firebaseClient'
import { buildFullSeed } from './seedData'
import { uid } from './constants'

const LOCAL_KEY = 'copahue_tarifario_data'
const DOC_PATH = ['tarifario', 'mostrador']

const emptyState = {
  categories: [],
  monthlyRates: [],
  dayOverrides: [],
  increaseVariables: [],
  cochera: [],
  salon: [],
  salonConfig: { ref4hCategoryId: null, ref5hCategoryId: null },
  fotos: { price: null, comments: '', active: true },
  months: [],
  tariffTypes: [],
}

const DataCtx = createContext(null)

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [mode, setMode] = useState('loading') // 'firebase' | 'local'
  const [firebaseError, setFirebaseError] = useState(null)
  const unsubRef = useRef(null)
  const dbRef = useRef(null)

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setData({ ...emptyState, ...parsed })
      } else {
        const seed = buildFullSeed()
        localStorage.setItem(LOCAL_KEY, JSON.stringify(seed))
        setData(seed)
      }
    } catch (e) {
      console.error(e)
      setData(buildFullSeed())
    }
    setMode('local')
  }, [])

  useEffect(() => {
    const config = getSavedFirebaseConfig()
    if (!config) {
      loadLocal()
      return
    }
    const db = getFirestoreDb()
    if (!db) {
      setFirebaseError('No se pudo conectar a Firebase, se usará almacenamiento local.')
      loadLocal()
      return
    }
    dbRef.current = db
    const ref = doc(db, ...DOC_PATH)
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (snap.exists()) {
          setData({ ...emptyState, ...snap.data() })
        } else {
          // primer uso: sembrar datos iniciales en Firestore
          const seed = buildFullSeed()
          await setDoc(ref, seed)
          setData(seed)
        }
        setMode('firebase')
      },
      (err) => {
        console.error('Firestore error', err)
        setFirebaseError('Error de conexión con Firebase: ' + err.message + '. Usando almacenamiento local.')
        loadLocal()
      }
    )
    unsubRef.current = unsub
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [loadLocal])

  const persist = useCallback((next) => {
    if (mode === 'firebase' && dbRef.current) {
      const ref = doc(dbRef.current, ...DOC_PATH)
      setDoc(ref, next, { merge: true }).catch(e => {
        console.error('Error guardando en Firebase', e)
      })
    } else {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
    }
  }, [mode])

  const update = useCallback((patchFn) => {
    setData(prev => {
      const next = typeof patchFn === 'function' ? patchFn(prev) : { ...prev, ...patchFn }
      persist(next)
      return next
    })
  }, [persist])

  const reconnectFirebase = useCallback(() => {
    setMode('loading')
    window.location.reload()
  }, [])

  const value = { data, mode, firebaseError, update, reconnectFirebase, uid }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1210] text-[#e9d9a8]">
        Cargando tarifario…
      </div>
    )
  }

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

export function useData() {
  const ctx = useContext(DataCtx)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
