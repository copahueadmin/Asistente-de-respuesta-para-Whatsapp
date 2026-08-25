import React, { useState } from 'react'
import { useData } from '../lib/DataContext.jsx'
import { CAPACITY_GROUPS, uid } from '../lib/constants'

const emptyForm = { id: null, name: '', group: 'single', rooms: '', active: true }

export default function CategoriasPage() {
  const { data, update } = useData()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  function startNew(groupId) {
    setForm({ ...emptyForm, group: groupId || 'single' })
    setEditingId(null)
  }

  function startEdit(cat) {
    setForm({ ...cat })
    setEditingId(cat.id)
  }

  function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    update(prev => {
      const categories = editingId
        ? prev.categories.map(c => (c.id === editingId ? { ...form } : c))
        : [...prev.categories, { ...form, id: uid('cat') }]
      return { ...prev, categories }
    })
    setForm(emptyForm)
    setEditingId(null)
  }

  function remove(id) {
    if (!confirm('¿Eliminar esta categoría? También se borrarán sus precios cargados.')) return
    update(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      monthlyRates: prev.monthlyRates.filter(r => r.categoryId !== id),
      dayOverrides: prev.dayOverrides.filter(o => o.categoryId !== id && o.refCategoryId !== id),
    }))
    if (editingId === id) { setForm(emptyForm); setEditingId(null) }
  }

  function toggleActive(cat) {
    update(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === cat.id ? { ...c, active: !c.active } : c),
    }))
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-copahue-green">Categorías</h2>
        <p className="text-sm text-copahue-black/60 mt-1">
          Creá categorías nuevas sin necesidad de indicar un precio ahora. Después cargás los precios mes a mes en la pestaña Tarifas.
        </p>
      </div>

      <form onSubmit={save} className="bg-white border border-copahue-gold/30 rounded-lg p-4 shadow-sm grid sm:grid-cols-5 gap-3 items-end">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-copahue-black/60 mb-1">Nombre de categoría</label>
          <input
            className="w-full border border-copahue-black/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copahue-gold"
            placeholder="Ej: Standard Mini"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-copahue-black/60 mb-1">Cantidad de personas</label>
          <select
            className="w-full border border-copahue-black/20 rounded px-3 py-2 text-sm"
            value={form.group}
            onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
          >
            {CAPACITY_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-copahue-black/60 mb-1">
            Habitaciones / categorías incluidas <span className="font-normal">(opcional)</span>
          </label>
          <input
            className="w-full border border-copahue-black/20 rounded px-3 py-2 text-sm"
            placeholder="Ej: Hab. 210, 212 — o: Standard - Standard Mini"
            value={form.rooms}
            onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-copahue-green text-white rounded px-3 py-2 text-sm font-medium hover:bg-copahue-green-dark">
            {editingId ? 'Guardar' : 'Agregar'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(emptyForm); setEditingId(null) }} className="px-3 py-2 text-sm text-copahue-black/60 hover:text-copahue-black">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-6">
        {CAPACITY_GROUPS.map(group => {
          const cats = data.categories.filter(c => c.group === group.id)
          return (
            <div key={group.id} className="bg-white border border-copahue-black/10 rounded-lg overflow-hidden">
              <div className="bg-copahue-green text-copahue-gold-light font-display text-lg px-4 py-2 flex justify-between items-center">
                <span>{group.label}</span>
                <button onClick={() => startNew(group.id)} className="text-xs bg-copahue-gold text-copahue-black rounded px-2 py-1 font-sans font-semibold hover:bg-copahue-gold-light">
                  + Nueva en {group.label}
                </button>
              </div>
              {cats.length === 0 ? (
                <p className="px-4 py-3 text-sm text-copahue-black/40 italic">Sin categorías todavía.</p>
              ) : (
                <ul className="divide-y divide-copahue-black/5">
                  {cats.map(c => (
                    <li key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-medium ${c.active ? 'text-copahue-black' : 'text-copahue-black/40 line-through'}`}>{c.name}</p>
                        {c.rooms && <p className="text-xs text-copahue-black/50 truncate">{c.rooms}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleActive(c)} className="text-xs px-2 py-1 rounded border border-copahue-black/20 text-copahue-black/60 hover:bg-copahue-black/5">
                          {c.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => startEdit(c)} className="text-xs px-2 py-1 rounded border border-copahue-gold text-copahue-gold-dark hover:bg-copahue-gold/10">
                          Editar
                        </button>
                        <button onClick={() => remove(c.id)} className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50">
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
