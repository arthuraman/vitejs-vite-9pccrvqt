import React, { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Users, ChevronRight } from 'lucide-react'
import { useApp } from '../App.jsx'
import { supabase } from '../lib/supabase.js'
import { haptic } from '../lib/telegram.js'

export default function SearchResults({ params }) {
  const { navigate, goBack } = useApp()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTrips() }, [])

  async function fetchTrips() {
    setLoading(true)
    const { data } = await supabase
      .from('trips')
      .select('*, users(first_name, last_name, username)')
      .eq('from_city', params.from)
      .eq('to_city', params.to)
      .gte('departure_date', params.date)
      .eq('status', 'active')
      .gt('available_seats', 0)
      .order('departure_date').order('departure_time')
    setTrips(data || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Хэдер */}
      <div style={{
        padding: '16px 20px', background: '#080E1A',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={goBack} style={{
            width: 38, height: 38, background: '#111C2E', border: 'none',
            borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer'
          }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>
              {params.from} → {params.to}
            </div>
            <div style={{ fontSize: 12, color: '#4B5563' }}>
              {fmtDate(params.date)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height: 130, background: '#111C2E', borderRadius: 20,
                opacity: 0.6 - i * 0.1
              }} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>Поездок не найдено</h3>
            <p style={{ color: '#4B5563', fontSize: 14 }}>
              Нет активных поездок на эту дату.<br />Попробуйте другую дату.
            </p>
            <button onClick={goBack} style={{
              marginTop: 24, padding: '12px 28px',
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 12, color: '#34D399', fontWeight: 600,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Изменить маршрут
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: '#4B5563', fontSize: 13, marginBottom: 12 }}>
              Найдено: {trips.length}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trips.map(trip => (
                <TripCard key={trip.id} trip={trip}
                  onPress={() => { haptic.light(); navigate('trip-detail', { trip }) }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip, onPress }) {
  const driver = trip.users
  const name = driver ? `${driver.first_name} ${driver.last_name || ''}`.trim() : 'Водитель'

  return (
    <button onClick={onPress} style={{
      width: '100%', background: '#111C2E',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 20, padding: 18, textAlign: 'left', cursor: 'pointer'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>{trip.from_city}</span>
        <div style={{ flex: 1, height: 2, background: 'rgba(52,211,153,0.25)', borderRadius: 1 }} />
        <span style={{ fontSize: 16, fontWeight: 800 }}>{trip.to_city}</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <Pill><Clock size={13} color="#34D399" /><span>{trip.departure_time?.slice(0,5)}</span></Pill>
        <Pill><Users size={13} color="#34D399" /><span>{trip.available_seats} мест</span></Pill>
        {trip.car_info && <Pill><span>🚗</span><span>{trip.car_info}</span></Pill>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: 'linear-gradient(135deg,#34D399,#059669)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, fontWeight: 700
          }}>
            {name[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 19, fontWeight: 900, color: '#34D399' }}>
            {trip.price_per_seat?.toLocaleString()} с
          </span>
          <ChevronRight size={16} color="#374151" />
        </div>
      </div>
    </button>
  )
}

function Pill({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '5px 9px'
    }}>
      {React.Children.map(children, child =>
        typeof child === 'string'
          ? <span style={{ fontSize: 12, color: '#9CA3AF' }}>{child}</span>
          : child
      )}
    </div>
  )
}

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}
