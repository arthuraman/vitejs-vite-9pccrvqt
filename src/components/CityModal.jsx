import React, { useState, useRef, useEffect } from 'react'
import { X, Search, Check } from 'lucide-react'
import { CITIES } from '../data/cities.js'
import { haptic } from '../lib/telegram.js'

export default function CityModal({ title, selected, onSelect, onClose }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150) }, [])

  const filtered = CITIES.filter(c => c.toLowerCase().includes(q.toLowerCase()))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#080E1A', display: 'flex', flexDirection: 'column'
    }}>
      {/* Шапка */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <button onClick={onClose} style={{
          width: 38, height: 38, background: '#1A2235', border: 'none',
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer'
        }}>
          <X size={18} color="white" />
        </button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
      </div>

      {/* Поиск */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{
          background: '#1A2235', borderRadius: 12, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <Search size={16} color="#4B5563" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Поиск города..."
            style={{
              background: 'transparent', border: 'none', color: 'white',
              fontSize: 15, flex: 1, fontFamily: 'inherit'
            }} />
        </div>
      </div>

      {/* Список */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px' }}>
        {filtered.map(city => (
          <button key={city} onClick={() => { haptic.light(); onSelect(city) }}
            style={{
              width: '100%', background: selected === city ? 'rgba(52,211,153,0.1)' : 'transparent',
              border: 'none', borderRadius: 12, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', marginBottom: 2, textAlign: 'left'
            }}>
            <span style={{
              fontSize: 16, fontWeight: selected === city ? 600 : 400,
              color: selected === city ? '#34D399' : 'white'
            }}>{city}</span>
            {selected === city && (
              <div style={{
                width: 22, height: 22, background: '#34D399', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Check size={12} color="white" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
