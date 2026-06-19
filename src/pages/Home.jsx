import React, { useState } from 'react'
import { MapPin, ArrowLeftRight, Calendar, Search, Plus, ChevronDown } from 'lucide-react'
import { useApp } from '../App.jsx'
import { haptic } from '../lib/telegram.js'
import CityModal from '../components/CityModal.jsx'

const GREEN = 'linear-gradient(135deg, #34D399 0%, #059669 100%)'
const CARD = { background: '#111C2E', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }

export default function Home() {
  const { navigate } = useApp()
  const [mode, setMode] = useState('passenger')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState(today())
  const [cityModal, setCityModal] = useState(null)
  const [error, setError] = useState('')

  function today() { return new Date().toISOString().split('T')[0] }

  function swap() {
    haptic.light()
    const t = from; setFrom(to); setTo(t)
  }

  function handleSearch() {
    if (!from) { setError('Выберите откуда'); return }
    if (!to) { setError('Выберите куда'); return }
    if (from === to) { setError('Города должны отличаться'); return }
    setError('')
    haptic.medium()
    navigate('results', { search: { from, to, date } })
  }

  function pickCity(city) {
    if (cityModal === 'from') setFrom(city)
    else setTo(city)
    setCityModal(null)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Хэдер */}
      <div style={{ padding: '52px 24px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, background: GREEN, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>🚗</div>
          <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>Аман</span>
        </div>
        <p style={{ color: '#4B5563', fontSize: 13, letterSpacing: 0.3 }}>
          Межрегиональные поездки · Кыргызстан
        </p>
      </div>

      {/* Переключатель */}
      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ background: '#111C2E', borderRadius: 16, padding: 4, display: 'flex', gap: 4 }}>
          {[['passenger', '🚶 Пассажир'], ['driver', '🚗 Водитель']].map(([key, label]) => (
            <button key={key} onClick={() => { setMode(key); haptic.light() }} style={{
              flex: 1, padding: '11px 0', borderRadius: 12, border: 'none',
              background: mode === key ? GREEN : 'transparent',
              color: mode === key ? 'white' : '#4B5563',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'inherit'
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px', flex: 1 }}>
        {mode === 'passenger' ? (
          <>
            {/* Блок маршрута */}
            <div style={{ ...CARD, marginBottom: 12, overflow: 'hidden' }}>
              <CityButton label="ОТКУДА" value={from} placeholder="Выберите город"
                onClick={() => setCityModal('from')} />
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
                <button onClick={swap} style={{
                  width: 34, height: 34, background: '#1A2845',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                  <ArrowLeftRight size={14} color="#34D399" />
                </button>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
              </div>
              <CityButton label="КУДА" value={to} placeholder="Выберите город"
                onClick={() => setCityModal('to')} />
            </div>

            {/* Дата */}
            <div style={{ ...CARD, marginBottom: 20 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', cursor: 'pointer'
              }}>
                <IconBox><Calendar size={17} color="#34D399" /></IconBox>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 3 }}>ДАТА</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDate(date)}</div>
                </div>
                <input type="date" value={date} min={today()}
                  onChange={e => setDate(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
                <ChevronDown size={16} color="#374151" />
              </label>
            </div>

            {error && (
              <p style={{ color: '#F87171', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{error}</p>
            )}

            <button onClick={handleSearch} style={{
              width: '100%', padding: '16px', background: GREEN, border: 'none',
              borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, fontFamily: 'inherit',
              boxShadow: '0 6px 28px rgba(52,211,153,0.25)'
            }}>
              <Search size={18} /> Найти поездку
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛣️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Вы — водитель</h2>
            <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Добавьте поездку — пассажиры<br />найдут вас сами
            </p>
            <button onClick={() => { haptic.medium(); navigate('driver') }} style={{
              padding: '15px 36px', background: GREEN, border: 'none',
              borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
              gap: 8, fontFamily: 'inherit',
              boxShadow: '0 6px 28px rgba(52,211,153,0.25)'
            }}>
              <Plus size={18} /> Добавить поездку
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#1F2D42', fontSize: 12 }}>Аман — безопасные поездки по КР</p>
      </div>

      {cityModal && (
        <CityModal
          title={cityModal === 'from' ? 'Откуда' : 'Куда'}
          selected={cityModal === 'from' ? from : to}
          onSelect={pickCity}
          onClose={() => setCityModal(null)}
        />
      )}
    </div>
  )
}

function CityButton({ label, value, placeholder, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'transparent', border: 'none',
      padding: '15px 16px', display: 'flex', alignItems: 'center',
      gap: 12, cursor: 'pointer', textAlign: 'left'
    }}>
      <IconBox><MapPin size={17} color="#34D399" /></IconBox>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: value ? 600 : 400, color: value ? 'white' : '#374151' }}>
          {value || placeholder}
        </div>
      </div>
      <ChevronDown size={16} color="#374151" />
    </button>
  )
}

function IconBox({ children }) {
  return (
    <div style={{
      width: 36, height: 36, background: 'rgba(52,211,153,0.1)',
      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>{children}</div>
  )
}

function fmtDate(d) {
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
}
