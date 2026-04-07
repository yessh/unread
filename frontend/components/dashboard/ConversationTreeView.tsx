'use client'

import { useState, useMemo } from 'react'
import type { ConversationTreeNode } from '@/lib/types'

interface ConversationTreeViewProps {
  nodes: ConversationTreeNode[]
}

const NODE_W = 160
const NODE_H = 52
const H_GAP = 32
const V_GAP = 72

function computeLayout(nodes: ConversationTreeNode[]) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const levels = new Map<string, number>()

  // 루트 노드부터 BFS
  const queue: string[] = []
  nodes.forEach((n) => {
    if (n.parent_ids.length === 0) {
      levels.set(n.id, 0)
      queue.push(n.id)
    }
  })

  while (queue.length > 0) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (!node) continue
    const level = levels.get(id)!

    node.child_ids.forEach((childId) => {
      const existing = levels.get(childId)
      if (existing === undefined || existing < level + 1) {
        levels.set(childId, level + 1)
        queue.push(childId)
      }
    })
  }

  // 레벨별 노드 그룹화 (순서 보존)
  const byLevel = new Map<number, string[]>()
  nodes.forEach((n) => {
    const lv = levels.get(n.id) ?? 0
    if (!byLevel.has(lv)) byLevel.set(lv, [])
    byLevel.get(lv)!.push(n.id)
  })

  // 가장 넓은 레벨 기준 SVG 너비 결정
  let maxLevelCount = 1
  byLevel.forEach((ids) => {
    if (ids.length > maxLevelCount) maxLevelCount = ids.length
  })
  const svgWidth = maxLevelCount * NODE_W + (maxLevelCount - 1) * H_GAP

  // 각 노드 위치 계산 (레벨 내 중앙 정렬)
  const positions = new Map<string, { x: number; y: number }>()
  byLevel.forEach((ids, level) => {
    const rowWidth = ids.length * NODE_W + (ids.length - 1) * H_GAP
    const startX = (svgWidth - rowWidth) / 2
    ids.forEach((id, col) => {
      positions.set(id, {
        x: startX + col * (NODE_W + H_GAP),
        y: level * (NODE_H + V_GAP),
      })
    })
  })

  const maxLevel = byLevel.size > 0 ? Math.max(...Array.from(byLevel.keys())) : 0
  const svgHeight = (maxLevel + 1) * (NODE_H + V_GAP) - V_GAP

  return { positions, svgWidth, svgHeight }
}

export function ConversationTreeView({ nodes }: ConversationTreeViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null)

  const { positions, svgWidth, svgHeight } = useMemo(() => computeLayout(nodes), [nodes])

  const edges = useMemo(() => {
    const list: { from: string; to: string }[] = []
    nodes.forEach((n) => n.child_ids.forEach((childId) => list.push({ from: n.id, to: childId })))
    return list
  }, [nodes])

  const selectedNode = nodes.find((n) => n.id === selectedId)

  const PADDING = 24

  return (
    <div className="flex h-[520px] gap-5">
      {/* 트리 뷰 (왼쪽, 세로 스크롤) */}
      <div className="w-80 shrink-0 overflow-auto rounded-xl border border-surface-elevated bg-surface-card p-3">
        <svg
          width={svgWidth + PADDING * 2}
          height={svgHeight + PADDING * 2}
          className="block"
        >
          <g transform={`translate(${PADDING}, ${PADDING})`}>
            {/* 연결선 */}
            {edges.map(({ from, to }) => {
              const fp = positions.get(from)
              const tp = positions.get(to)
              if (!fp || !tp) return null
              const x1 = fp.x + NODE_W / 2
              const y1 = fp.y + NODE_H
              const x2 = tp.x + NODE_W / 2
              const y2 = tp.y
              const midY = (y1 + y2) / 2
              return (
                <path
                  key={`${from}-${to}`}
                  d={`M ${x1} ${y1} C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`}
                  fill="none"
                  stroke="#7c6af7"
                  strokeWidth={2}
                  strokeOpacity={0.35}
                />
              )
            })}

            {/* 노드 */}
            {nodes.map((node) => {
              const pos = positions.get(node.id)
              if (!pos) return null
              const isSelected = selectedId === node.id

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill={isSelected ? '#7c6af7' : 'var(--color-surface-elevated, #1e1e2e)'}
                    stroke={isSelected ? '#a78bfa' : '#3d3d5c'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  {/* 연결점 위 */}
                  <circle cx={NODE_W / 2} cy={0} r={3} fill={isSelected ? '#a78bfa' : '#7c6af7'} fillOpacity={0.6} />
                  {/* 연결점 아래 */}
                  <circle cx={NODE_W / 2} cy={NODE_H} r={3} fill={isSelected ? '#a78bfa' : '#7c6af7'} fillOpacity={0.6} />

                  <foreignObject x={6} y={6} width={NODE_W - 12} height={NODE_H - 12}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#ffffff' : '#a0a0c0',
                        lineHeight: '1.3',
                        wordBreak: 'keep-all',
                        overflow: 'hidden',
                      }}
                    >
                      {node.title}
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* 상세 내용 (오른쪽) */}
      <div className="flex flex-1 flex-col rounded-xl border border-surface-elevated bg-surface-card p-6">
        {selectedNode ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-accent-primary" />
              <h3 className="text-lg font-bold text-content-primary">{selectedNode.title}</h3>
            </div>
            <p className="flex-1 overflow-y-auto text-sm leading-relaxed text-content-secondary">
              {selectedNode.description}
            </p>
            {/* 연결 정보 */}
            <div className="mt-4 border-t border-surface-elevated pt-4 text-xs text-content-secondary">
              {selectedNode.parent_ids.length > 0 && (
                <span className="mr-4">
                  이전 주제:{' '}
                  {selectedNode.parent_ids
                    .map((pid) => nodes.find((n) => n.id === pid)?.title ?? pid)
                    .join(', ')}
                </span>
              )}
              {selectedNode.child_ids.length > 0 && (
                <span>
                  다음 주제:{' '}
                  {selectedNode.child_ids
                    .map((cid) => nodes.find((n) => n.id === cid)?.title ?? cid)
                    .join(', ')}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-content-secondary">
            노드를 클릭하면 상세 내용이 표시됩니다
          </div>
        )}
      </div>
    </div>
  )
}
