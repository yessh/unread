'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { HourlyChartData } from '@/lib/types'

interface HourlyFrequencyChartProps {
  data: HourlyChartData[]
}

export function HourlyFrequencyChart({ data }: HourlyFrequencyChartProps) {
  return (
    <div className="card">
      <h3 className="mb-6 text-lg font-semibold text-content-primary">시간대별 채팅 빈도</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c6af7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#252535" />
          <XAxis dataKey="hour" stroke="#a0a0b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#a0a0b8" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a24',
              border: '1px solid #252535',
              borderRadius: '8px',
              color: '#f1f1f5',
            }}
            cursor={{ stroke: 'rgba(124, 106, 247, 0.4)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#7c6af7"
            strokeWidth={2}
            fill="url(#colorCount)"
            dot={false}
            activeDot={{ r: 4, fill: '#7c6af7', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
