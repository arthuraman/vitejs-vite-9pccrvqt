import React, { useState } from 'react'
import { ArrowLeft, MapPin, Clock, Users, MessageCircle, Check, Minus, Plus } from 'lucide-react'
import { useApp } from '../App.jsx'
import { supabase } from '../lib/supabase.js'
import { haptic } from '../lib/telegram.js'

const GREEN = 'linear-gradient(135deg, #34D399 0%, #059669 100%)'

export default function TripDetail({ trip }) {
  const { goBack, currentUser } = useApp()
  const [seats, setSeats] = useState(1)
  const [pickup, setPickup] = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)
  const [error, setError] = useState('')

  const driver = trip.users
  const driverName = driver ? `${driver.first_name} ${driver.last_name || ''}`.trim() : 'Водитель'
  const total = seats * trip.price_per_seat

  async function book() {
    if (!currentUser) { setError('Ошибка авторизации'); return }
    setLoading(true); setError('')
    try {
      const { error: e } = await supabase.from('bookings').insert({
        trip_id: trip.id,
        passenger_id: currentUser.id,
        seats_count: seats,
        pickup_info: pickup,
        status: 'confirmed'
      })
      if (e) throw e
      await supabase.from('trips')
        .update({ available_seats: trip.available_seats - seats })
        .eq('id', trip.id)
      haptic.success()
      setBooked(true)
    } catch {
      haptic.error()
      setError('Ошибка. Попробуйте ещё раз.')
    }
    setLoading(false)
  }

  if (booked) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center'
    }}>
      <div style={{
        width: 88, height: 88, background: GREEN, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 0 50px rgba(52,211,153,0.35)'
      }}>
        <Check size={40} color="white" strokeWidth={2.5} />
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Забронировано!</h2>
      <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.7, marginBottom: 6 }}>
        {seats} {seatWord(seats)} · {trip.from_city} → {trip.to_city}
      </p>
      <p style={{ color: '#374151', fontSize: 13, marginBottom: 32 }}>
        Свяжитесь с водителем в Telegram
      </p>
      {driver?.username && (
        <a href={`https://t.me/${driver.username}`} target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 30px', background: GREEN, borderRadius: 14,
            color: 'white', textDecoration: 'none', fontWeight: 700,
            fontSize: 15, marginBottom: 14,
            boxShadow: '0 6px 28px rgba(52,211,153,0.25)'
          }}>
          <MessageCircle size={18} /> Написать водителю
        </a>
      )}
      <button onClick={goBack} style={{
        background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '12px 28px', color: '#6B7280',
        fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
      }}>На главную</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={goBack} style={{
            width: 38, height: 38, background: '#111C2E', border: 'none',
            borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer'
          }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 800 }}>Детали поездки</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
        {/* Маршрут */}
        <Card>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 16
          }}>
            <CityCol label="ОТКУДА" city={trip.from_city} />
            <div style={{
              width: 40, height: 40, background: 'rgba(52,211,153,0.1)',
              borderRadius: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20
            }}>→</div>
            <CityCol label="КУДА" city={trip.to_city} align="right" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip icon={<Clock size={13} color="#34D399" />} text={trip.departure_time?.slice(0,5)} />
            <Chip icon="📅" text={fmtDate(trip.departure_date)} />
            <Chip icon={<Users size={13} color="#34D399" />} text={`${trip.available_seats} мест`} />
          </div>
        </Card>

        {/* Водитель */}
        <Card>
          <Label>ВОДИТЕЛЬ</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 50, height: 50, background: GREEN, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800
            }}>
              {driverName[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{driverName}</div>
              {driver?.username && (
                <div style={{ fontSize: 13, color: '#4B5563' }}>@{driver.username}</div>
              )}
            </div>
          </div>
          {trip.car_info && <InfoRow emoji="🚗" text={trip.car_info} />}
          {trip.notes && <InfoRow emoji="💬" text={trip.notes} />}
          {trip.pickup_info && <InfoRow emoji="📍" text={trip.pickup_info} />}
        </Card>

        {/* Бронирование */}
        <Card>
          <Label>БРОНИРОВАНИЕ</Label>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>Количество мест</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: '#1A2235', borderRadius: 14, padding: '4px 8px',
              width: 'fit-content'
            }}>
              <button onClick={() => seats > 1 && setSeats(s => s - 1)} style={{
                width: 38, height: 38, background: '#111C2E', border: 'none',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer'
              }}>
                <Minus size={16} color="white" />
              </button>
              <span style={{ fontSize: 22, fontWeight: 800, minWidth: 24, textAlign: 'center' }}>
                {seats}
              </span>
              <button onClick={() => seats < Math.min(trip.available_seats, 3) && setSeats(s => s + 1)} style={{
                width: 38, height: 38, background: '#111C2E', border: 'none',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer'
              }}>
                <Plus size={16} color="white" />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Место посадки (необязательно)</div>
            <div style={{
              background: '#1A2235', borderRadius: 12, padding: '11px 14px',
              display: 'flex', gap: 8, alignItems: 'center'
            }}>
              <MapPin size={16} color="#34D399" />
              <input value={pickup} onChange={e => setPickup(e.target.value)}
                placeholder="Ул. Манаса 123, Бишкек"
                style={{
                  background: 'transparent', border: 'none', color: 'white',
                  fontSize: 14, flex: 1, fontFamily: 'inherit'
                }} />
            </div>
          </div>

          <div style={{
            background: 'rgba(52,211,153,0.08)', borderRadius: 12,
            padding: '12px 16px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              {seats} × {trip.price_per_seat?.toLocaleString()} с
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#34D399' }}>
              {total?.toLocaleString()} с
            </span>
          </div>
        </Card>

        {error && (
          <p style={{ color: '#F87171', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{error}</p>
        )}
      </div>

      <div style={{
        padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
        background: '#080E1A'
      }}>
        <button onClick={book} disabled={loading} style={{
          width: '100%', padding: '16px',
          background: loading ? '#1A2235' : GREEN,
          border: 'none', borderRadius: 16, color: 'white', fontSize: 16,
          fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: loading ? 'none' : '0 6px 28px rgba(52,211,153,0.25)'
        }}>
          {loading ? 'Бронируем...' : `Забронировать · ${total?.toLocaleString()} с`}
        </button>
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      background: '#111C2E', borderRadius: 20, padding: 20,
      marginBottom: 12, border: '1px solid rgba(255,255,255,0.05)'
    }}>{children}</div>
  )
}
function Label({ children }) {
  return <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 12 }}>{children}</div>
}
function CityCol({ label, city, align }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 10, color: '#4B5563', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{city}</div>
    </div>
  )
}
function Chip({ icon, text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '5px 9px'
    }}>
      {typeof icon === 'string' ? <span style={{ fontSize: 13 }}>{icon}</span> : icon}
      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{text}</span>
    </div>
  )
}
function InfoRow({ emoji, text }) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.04)'
    }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span style={{ fontSize: 13, color: '#9CA3AF' }}>{text}</span>
    </div>
  )
}
function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
function seatWord(n) {
  if (n === 1) return 'место'
  if (n < 5) return 'места'
  return 'мест'
}
