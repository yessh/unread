'use client'

import { BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import type { DayOfWeekChartData } from '@/lib/types'

interface DayOfWeekFrequencyChartProps {
  data: DayOfWeekChartData[]
}

export function DayOfWeekFrequencyChart({ data }: DayOfWeekFrequencyChartProps) {
  return (
    <div className="card">
      <h3 className="mb-6 text-lg font-semibold text-content-primary">요일별 채팅 빈도</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barCategoryGap="30%">
          <defs>
            <linearGradient id="colorDayBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#252535" vertical={false} />
          <XAxis dataKey="day" stroke="#a0a0b8" tick={{ fontSize: 13 }} />
          <Tooltip
            contentStyle={{ background: '#1a1a24', border: '1px solid #252535', borderRadius: 8 }}
            labelStyle={{ color: '#e0e0f0', fontWeight: 600 }}
            formatter={(value: number) => [`${value}%`, '비율']}
          />
          <Bar dataKey="count" fill="url(#colorDayBar)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
