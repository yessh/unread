'use client'

import { AreaChart, Area, XAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { MonthlyChartData } from '@/lib/types'

interface MonthlyFrequencyChartProps {
  data: MonthlyChartData[]
}

export function MonthlyFrequencyChart({ data }: MonthlyFrequencyChartProps) {
  return (
    <div className="card">
      <h3 className="mb-6 text-lg font-semibold text-content-primary">채팅 빈도</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#252535" />
          <XAxis
            dataKey="month"
            stroke="#a0a0b8"
            tick={{ fontSize: 11 }}
            interval={Math.max(0, Math.floor(data.length / 10))}
          />

          <Area
            type="monotone"
            dataKey="count"
            stroke="#4fc3f7"
            strokeWidth={2}
            fill="url(#colorMonthly)"
            dot={false}
            activeDot={{ r: 4, fill: '#4fc3f7', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
