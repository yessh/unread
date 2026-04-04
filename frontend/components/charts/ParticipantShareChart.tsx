'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import type { ParticipantChartData } from '@/lib/types'
import { getChartColor } from '@/lib/chartUtils'

interface ParticipantShareChartProps {
  data: ParticipantChartData[]
}

export function ParticipantShareChart({ data }: ParticipantShareChartProps) {
  const MAX_NAME_LENGTH = 12
  const truncatedData = data.map((item) => ({
    ...item,
    displayName: item.name.length > MAX_NAME_LENGTH ? item.name.substring(0, MAX_NAME_LENGTH) + '...' : item.name,
  }))

  return (
    <div className="card">
      <h3 className="mb-6 text-lg font-semibold text-content-primary">참여자별 메시지 비율</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={truncatedData} layout="vertical" margin={{ top: 5, right: 55, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#252535" />
          <XAxis type="number" stroke="#a0a0b8" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="displayName" width={100} stroke="#a0a0b8" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a24',
              border: '1px solid #252535',
              borderRadius: '8px',
              color: '#f1f1f5',
            }}
            formatter={(value: number, _name: string, props: any) => [
              `${value}개 (${props.payload.percentage}%)`,
              '메시지',
            ]}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(value: number) => `${value}%`}
              fill="#a0a0b8"
              fontSize={12}
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getChartColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
