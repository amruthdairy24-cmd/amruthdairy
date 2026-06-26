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
    <div className="bg-[#3dbade] dark:bg-slate-900 py-12 border-t border-white/10 dark:border-border/30">
      <div className="container-page">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-7 items-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center text-white">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3 text-white">
                {stat.icon}
              </div>
              <div className="text-3xl font-black leading-none font-mono">{stat.value}</div>
              <div className="text-xs text-white/85 mt-1 font-bold tracking-wider uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
