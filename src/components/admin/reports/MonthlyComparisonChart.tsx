'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface MonthlyComparisonChartProps {
  data: { month: string; revenue: number; volume: number }[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No monthly trend data available
      </div>
    );
  }

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
          <XAxis 
            dataKey="month" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            dy={10}
          />
          <YAxis 
            yAxisId="left"
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(val) => `₹${(val/1000)}k`}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(val) => `${val}L`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ fontWeight: 'bold' }}
            labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
          />
          <Bar yAxisId="left" dataKey="revenue" fill="url(#colorBar)" radius={[4, 4, 0, 0]} name="Revenue" barSize={20} />
          <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Volume" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
