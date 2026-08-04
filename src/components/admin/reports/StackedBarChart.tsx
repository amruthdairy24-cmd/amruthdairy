'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface StackedBarChartProps {
  data: { date: string; volume: number; expected?: number }[];
}

export default function StackedBarChart({ data }: StackedBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-sm text-slate-500">
        No volume data available.
      </div>
    );
  }

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
            tickFormatter={(val) => `${val}L`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ fontWeight: 'bold' }}
            labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            formatter={(value: any) => [`${value} L`, 'Volume Delivered']}
          />
          <Bar 
            dataKey="volume" 
            stackId="a" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]} 
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
