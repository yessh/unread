'use client'

import { useState, useMemo } from 'react'
import type { ConversationTreeNode, ScheduleInfo, FactInfo } from '@/lib/types'

const CATEGORY_STYLE: Record<string, string> = {
  결론:   'bg-purple-900/40 text-purple-300',
  합의:   'bg-green-900/40 text-green-300',
  정보:   'bg-blue-900/40 text-blue-300',
  미결:   'bg-yellow-900/40 text-yellow-300',
}

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_STYLE[category] ?? 'bg-surface-elevated text-content-secondary'
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{category}</span>
  )
}

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
    <div className="flex h-[780px] gap-5">
      {/* 트리 뷰 (왼쪽, 스크롤바 숨김) */}
      <div className="w-[45%] shrink-0 overflow-auto rounded-xl border border-surface-elevated bg-surface-card p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      <div className="flex flex-1 flex-col overflow-auto rounded-xl border border-surface-elevated bg-surface-card p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {selectedNode ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-accent-primary" />
              <h3 className="text-lg font-bold text-content-primary">{selectedNode.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-content-secondary">
              {selectedNode.description}
            </p>

            {/* 일정 정보 */}
            {selectedNode.schedules && selectedNode.schedules.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-primary">일정</p>
                <div className="flex flex-col gap-2">
                  {selectedNode.schedules.map((s, i) => (
                    <div key={i} className="rounded-lg border border-surface-elevated bg-surface-base px-4 py-3">
                      {s.event && (
                        <p className="text-sm font-medium text-content-primary">{s.event}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {s.time && (
                          <span className="flex items-center gap-1 text-xs text-content-secondary">
                            <span className="text-accent-secondary">시각</span>
                            {s.time}
                          </span>
                        )}
                        {s.location && (
                          <span className="flex items-center gap-1 text-xs text-content-secondary">
                            <span className="text-accent-secondary">장소</span>
                            {s.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최종 정보 */}
            {selectedNode.facts && selectedNode.facts.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-secondary">정리된 정보</p>
                <div className="flex flex-col gap-2">
                  {selectedNode.facts.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-surface-elevated bg-surface-base px-4 py-3">
                      <CategoryBadge category={f.category} />
                      <p className="text-xs leading-relaxed text-content-secondary">{f.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 연결 정보 */}
            <div className="mt-auto border-t border-surface-elevated pt-4 text-xs text-content-secondary">
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
