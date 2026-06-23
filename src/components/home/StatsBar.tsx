'use client'

import { Users, Shield, Award, Clock } from 'lucide-react'

const stats = [
  {
    icon: <Users size={24} />,
    value: '5000+',
    label: 'Happy Families'
  },
  {
    icon: <Award size={24} />,
    value: '50+',
    label: 'Healthy Cows'
  },
  {
    icon: <Shield size={24} />,
    value: '100%',
    label: 'Pure & Natural'
  },
  {
    icon: <Clock size={24} />,
    value: 'Daily',
    label: 'On-Time Delivery'
  }
]

export function StatsBar() {
  return (
    <div style={{ background: '#3dbade', padding: '48px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="container-page">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', alignItems: 'center' }} className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: '#fff' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#fff'
              }} className="stats-icon-wrapper">
                {stat.icon}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1.1, fontFamily: 'var(--font-jetbrains-mono)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px', fontWeight: 700, letterSpacing: '0.02em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}
