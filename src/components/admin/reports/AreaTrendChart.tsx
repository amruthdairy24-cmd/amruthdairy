'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AreaTrendChartProps {
  data: { date: string; revenue: number }[];
}

export default function AreaTrendChart({ data }: AreaTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-sm text-slate-500">
        No trend data available for this period.
      </div>
    );
  }

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
          <XAxis 
            dataKey="date" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(val) => {
              const d = new Date(val);
              return d.getDate().toString();
            }}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
            labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#10B981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            activeDot={{ r: 4, strokeWidth: 0, fill: '#10B981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
