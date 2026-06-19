import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, ChevronDown, Trash2 } from 'lucide-react'
import { useApp } from '../App.jsx'
import { supabase } from '../lib/supabase.js'
import { haptic } from '../lib/telegram.js'
import CityModal from '../components/CityModal.jsx'

const GREEN = 'linear-gradient(135deg, #34D399 0%, #059669 100%)'
const today = () => new Date().toISOString().split('T')[0]

export default function DriverPanel() {
  const { goBack, currentUser } = useApp()
  const [tab, setTab] = useState('create')
  const [myTrips, setMyTrips] = useState([])
  const [loadingTrips, setLoadingTrips] = useState(false)
  const [cityModal, setCityModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    from: '', to: '', date: today(), time: '08:00',
    seats: 3, price: '', car: '', pickup: '', notes: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { if (tab === 'mytrips') fetchMyTrips() }, [tab])

  async function fetchMyTrips() {
    if (!currentUser) return
    setLoadingTrips(true)
    const { data } = await supabase
      .from('trips')
      .select('*, bookings(seats_count, status)')
      .eq('driver_id', currentUser.id)
      .order('departure_date', { ascending: false })
    setMyTrips(data || [])
    setLoadingTrips(false)
  }

  async function submit() {
    if (!form.from) { setError('Выберите откуда'); return }
    if (!form.to) { setError('Выберите куда'); return }
    if (form.from === form.to) { setError('Города должны отличаться'); return }
    if (!form.price || isNaN(+form.price)) { setError('Укажите цену за место'); return }
    if (!currentUser) { setError('Ошибка авторизации'); return }
    setSaving(true); setError('')
    const { error: e } = await supabase.from('trips').insert({
      driver_id: currentUser.id,
      from_city: form.from, to_city: form.to,
      departure_date: form.date,
      departure_time: form.time + ':00',
      total_seats: form.seats, available_seats: form.seats,
      price_per_seat: +form.price,
      car_info: form.car, pickup_info: form.pickup, notes: form.notes,
      status: 'active'
    })
    if (e) { haptic.error(); setError('Ошибка. Попробуйте снова.') }
    else {
      haptic.success(); setSaved(true)
      setForm({ from: '', to: '', date: today(), time: '08:00', seats: 3, price: '', car: '', pickup: '', notes: '' })
      setTimeout(() => setSaved(false), 4000)
    }
    setSaving(false)
  }

  async function cancelTrip(id) {
    haptic.medium()
    await supabase.from('trips').update({ status: 'cancelled' }).eq('id', id)
    fetchMyTrips()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Хэдер */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={goBack} style={{
            width: 38, height: 38, background: '#111C2E', border: 'none',
            borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer'
          }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 800 }}>Кабинет водителя</span>
        </div>
        <div style={{ background: '#111C2E', borderRadius: 12, padding: 4, display: 'flex', gap: 4 }}>
          {[['create', '+ Новая поездка'], ['mytrips', 'Мои поездки']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
              background: tab === k ? GREEN : 'transparent',
              color: tab === k ? 'white' : '#4B5563',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {tab === 'create' ? (
          <>
            {saved && (
              <div style={{
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                color: '#34D399', fontSize: 14, textAlign: 'center'
              }}>
                ✅ Поездка опубликована! Пассажиры найдут вас.
              </div>
            )}

            <Section label="МАРШРУТ">
              <FieldBtn label="ОТКУДА" value={form.from} placeholder="Выберите город" onClick={() => setCityModal('from')} />
              <Div />
              <FieldBtn label="КУДА" value={form.to} placeholder="Выберите город" onClick={() => setCityModal('to')} />
            </Section>

            <Section label="ДАТА И ВРЕМЯ">
              <div style={{ display: 'flex' }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>📅</span>
                  <div>
                    <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 2 }}>ДАТА</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtShort(form.date)}</div>
                    <input type="date" value={form.date} min={today()} onChange={e => set('date', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
                  </div>
                </label>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.04)' }} />
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>🕐</span>
                  <div>
                    <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 2 }}>ВРЕМЯ</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{form.time}</div>
                    <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
                  </div>
                </label>
              </div>
            </Section>

            <Section label="МЕСТА И ЦЕНА">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 10 }}>МЕСТ ДЛЯ ПАССАЖИРОВ</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4].map(n => (
                    <button key={n} onClick={() => set('seats', n)} style={{
                      flex: 1, padding: '11px 0', border: 'none', borderRadius: 10,
                      background: form.seats === n ? GREEN : '#1A2235',
                      color: form.seats === n ? 'white' : '#4B5563',
                      fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                    }}>{n}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>💵</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 4 }}>ЦЕНА ЗА 1 МЕСТО (сом)</div>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                    placeholder="500" style={{
                      background: 'transparent', border: 'none', color: 'white',
                      fontSize: 20, fontWeight: 800, width: '100%', fontFamily: 'inherit'
                    }} />
                </div>
              </div>
            </Section>

            <Section label="ДОПОЛНИТЕЛЬНО (необязательно)">
              <TxtInput emoji="🚗" label="АВТО" placeholder="Camry белый, Nexia серебристый" value={form.car} onChange={v => set('car', v)} />
              <Div />
              <TxtInput emoji="📍" label="МЕСТО ПОСАДКИ" placeholder="Откуда забираете" value={form.pickup} onChange={v => set('pickup', v)} />
              <Div />
              <TxtInput emoji="💬" label="КОММЕНТАРИЙ" placeholder="Для пассажиров" value={form.notes} onChange={v => set('notes', v)} />
            </Section>

            {error && <p style={{ color: '#F87171', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{error}</p>}

            <button onClick={submit} disabled={saving} style={{
              width: '100%', padding: '16px', background: saving ? '#1A2235' : GREEN,
              border: 'none', borderRadius: 16, color: 'white', fontSize: 16,
              fontWeight: 700, cursor: saving ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, fontFamily: 'inherit', marginBottom: 32,
              boxShadow: saving ? 'none' : '0 6px 28px rgba(52,211,153,0.25)'
            }}>
              <Plus size={18} />
              {saving ? 'Публикуем...' : 'Опубликовать поездку'}
            </button>
          </>
        ) : (
          loadingTrips ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#4B5563' }}>Загрузка...</div>
          ) : myTrips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🗺️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Нет поездок</h3>
              <p style={{ color: '#4B5563', fontSize: 14 }}>Добавьте первую поездку</p>
              <button onClick={() => setTab('create')} style={{
                marginTop: 20, padding: '12px 28px', background: GREEN, border: 'none',
                borderRadius: 12, color: 'white', fontWeight: 700,
                fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
              }}>Создать поездку</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myTrips.map(trip => <DriverCard key={trip.id} trip={trip} onCancel={cancelTrip} />)}
            </div>
          )
        )}
      </div>

      {cityModal && (
        <CityModal
          title={cityModal === 'from' ? 'Откуда' : 'Куда'}
          selected={cityModal === 'from' ? form.from : form.to}
          onSelect={city => { set(cityModal === 'from' ? 'from' : 'to', city); setCityModal(null) }}
          onClose={() => setCityModal(null)}
        />
      )}
    </div>
  )
}

function DriverCard({ trip, onCancel }) {
  const bookings = (trip.bookings || []).filter(b => b.status !== 'cancelled')
  const booked = bookings.reduce((s, b) => s + (b.seats_count || 0), 0)
  const active = trip.status === 'active'
  return (
    <div style={{
      background: '#111C2E', borderRadius: 20, padding: 18,
      border: `1px solid ${active ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)'}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>
            {trip.from_city} → {trip.to_city}
          </div>
          <div style={{ fontSize: 13, color: '#4B5563' }}>
            {fmtShort(trip.departure_date)} · {trip.departure_time?.slice(0,5)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#34D399', marginBottom: 4 }}>
            {trip.price_per_seat?.toLocaleString()} с
          </div>
          <div style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 6,
            background: active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
            color: active ? '#34D399' : '#4B5563'
          }}>
            {active ? 'Активна' : 'Отменена'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          Заброней: <strong style={{ color: 'white' }}>{booked}</strong> из {trip.total_seats}
        </span>
        {active && (
          <button onClick={() => onCancel(trip.id)} style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '6px 12px', color: '#EF4444',
            fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 4, fontFamily: 'inherit'
          }}>
            <Trash2 size={12} /> Отменить
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 8, paddingLeft: 4 }}>{label}</div>
      <div style={{
        background: '#111C2E', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden'
      }}>{children}</div>
    </div>
  )
}
function FieldBtn({ label, value, placeholder, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'transparent', border: 'none',
      padding: '13px 16px', display: 'flex', alignItems: 'center',
      gap: 10, cursor: 'pointer', textAlign: 'left'
    }}>
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
function TxtInput({ emoji, label, placeholder, value, onChange }) {
  return (
    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{
            background: 'transparent', border: 'none', color: 'white',
            fontSize: 14, width: '100%', fontFamily: 'inherit'
          }} />
      </div>
    </div>
  )
}
function Div() { return <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginLeft: 16 }} /> }
function fmtShort(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
