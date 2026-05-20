import React from 'react'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function roundTo(n, digits = 0) {
  const p = 10 ** digits
  return Math.round(n * p) / p
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle)
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle)
  const startInner = polarToCartesian(cx, cy, rInner, startAngle)
  const endInner = polarToCartesian(cx, cy, rInner, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ')
}

export function DonutChart({
  segments,
  size = 260,
  thickness = 26,
  centerLabel,
  centerValue,
  legendMode = 'percent', // 'percent' | 'values'
  showLegend = true,
  tooltip = false,
  stroke = '#ffffff',
  strokeWidth = 2,
}) {
  const total = segments.reduce((acc, s) => acc + (Number(s.value) || 0), 0) || 1
  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 8
  const rInner = rOuter - thickness

  const [tip, setTip] = React.useState(null)
  const [activeLabel, setActiveLabel] = React.useState(null)
  const [activeColor, setActiveColor] = React.useState(null)

  let angle = 0
  const paths = segments.map((s) => {
    const value = Number(s.value) || 0
    const sweep = (value / total) * 360
    const start = angle
    const end = angle + sweep
    angle = end
    return {
      label: s.label,
      value,
      color: s.color,
      d: arcPath(cx, cy, rOuter, rInner, start, end),
    }
  })

  const showCenter = centerLabel != null || centerValue != null
  const displayedCenterValue = centerValue ?? String(total)

  return (
    <div className="w-100 d-flex flex-column gap-16">
      <div className="w-100 d-flex justify-content-center position-relative">
        {tooltip && tip && (
          <div
            style={{
              position: 'absolute',
              left: tip.x,
              top: tip.y,
              transform: 'translate(-50%, -120%)',
              background: tip.color || '#009F5E',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
          >
            {tip.label}: {tip.value}
          </div>
        )}
        <svg
          width="100%"
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Donut chart"
          onMouseLeave={() => setTip(null)}
          style={{ maxWidth: size }}
        >
          {paths.map((p, idx) => (
            <path
              key={idx}
              d={p.d}
              fill={p.color}
              stroke={stroke}
              strokeWidth={strokeWidth}
              style={{
                cursor: tooltip ? 'pointer' : 'default',
                transformBox: 'fill-box',
                transformOrigin: 'center',
                transform: activeLabel === p.label ? 'scale(1.035)' : 'scale(1)',
                filter:
                  activeLabel === p.label && activeColor
                    ? `drop-shadow(0 0 10px ${activeColor}55)`
                    : 'none',
                transition: 'transform 180ms ease, opacity 180ms ease',
                opacity: activeLabel && activeLabel !== p.label ? 0.82 : 1,
              }}
              onMouseMove={(e) => {
                if (!tooltip) return
                const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                setTip({
                  label: p.label,
                  value: p.value,
                  color: p.color,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                })
              }}
              onMouseEnter={() => {
                setActiveLabel(p.label)
                setActiveColor(p.color)
                if (!tooltip) return
                setTip((t) =>
                  t
                    ? { ...t, label: p.label, value: p.value, color: p.color }
                    : { label: p.label, value: p.value, color: p.color, x: cx, y: 18 },
                )
              }}
              onMouseLeave={() => {
                setActiveLabel(null)
                setActiveColor(null)
              }}
            />
          ))}
          {showCenter && (centerLabel || displayedCenterValue) && (
            <>
              {displayedCenterValue != null && (
                <text
                  x={cx}
                  y={cy + 6}
                  textAnchor="middle"
                  className="fill-black"
                  style={{ fontSize: 34, fontWeight: 800 }}
                >
                  {displayedCenterValue}
                </text>
              )}
              {centerLabel && (
                <text
                  x={cx}
                  y={cy + 40}
                  textAnchor="middle"
                  className="fill-black"
                  style={{ fontSize: 16, opacity: 0.65 }}
                >
                  {centerLabel}
                </text>
              )}
            </>
          )}
        </svg>
      </div>

      {showLegend && (
        <div className="d-flex flex-wrap justify-content-center gap-20 mt-8">
          {segments.map((s) => (
            <div key={s.label} className="d-flex align-items-center gap-8">
              <span
                className="w-10-px h-10-px radius-2"
                style={{
                  background: s.color,
                  transform: 'rotate(45deg)',
                  borderRadius: 2,
                  display: 'inline-block',
                }}
              ></span>
              <span className="text-secondary-light text-sm fw-semibold">
                {legendMode === 'values' ? (
                  <>
                    {s.label}: <span className="text-primary-light fw-bold">{Number(s.value) || 0}</span>
                  </>
                ) : (
                  <>
                    {s.label}:{' '}
                    <span className="text-primary-light fw-bold">
                      {roundTo((Number(s.value) / total) * 100, 0)}%
                    </span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function BarChart({
  labels,
  series,
  height = 260,
  maxValue: maxValueProp,
  showGrid = true,
  stacked = false,
  showValueLabels = false,
  valueFormatter,
  valueLabelFormatter,
  yLabelFormatter,
  tooltip = false,
  tooltipTitleFormatter,
}) {
  const width = 640
  const pad = { top: 16, right: 16, bottom: 44, left: 40 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const all = series.flatMap((s) => s.data.map((v) => Number(v) || 0))
  const maxValue =
    Math.max(
      1,
      maxValueProp ??
        (stacked
          ? Math.max(
              ...labels.map((_, i) =>
                series.reduce((acc, s) => acc + (Number(s.data[i]) || 0), 0),
              ),
            )
          : Math.max(...all, 1)),
    ) || 1

  const groups = labels.length
  const barsPerGroup = stacked ? 1 : Math.max(1, series.length)
  const groupGap = 16
  const barGap = 6
  const groupW =
    (plotW - groupGap * (groups - 1)) / Math.max(1, groups)
  const barW = stacked
    ? clamp(groupW * 0.62, 14, 44)
    : clamp((groupW - barGap * (barsPerGroup - 1)) / barsPerGroup, 6, 40)

  const gridLines = 4
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => i / gridLines)
  const fmt = valueFormatter ?? ((v) => String(v))
  const fmtLabel = valueLabelFormatter ?? fmt
  const fmtY = yLabelFormatter ?? ((v) => String(v))

  const [hoverIdx, setHoverIdx] = React.useState(null)
  const activeIdx =
    hoverIdx == null ? null : Math.max(0, Math.min(labels.length - 1, hoverIdx))
  const groupWForX =
    (plotW - groupGap * (groups - 1)) / Math.max(1, groups)
  const stepForX = groupWForX + groupGap

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Bar chart"
      style={{ overflow: 'visible' }}
    >
      {showGrid &&
        ticks.map((t) => {
          const y = pad.top + (1 - t) * plotH
          return (
            <g key={t}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + plotW}
                y2={y}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
              />
              <text
                x={pad.left - 8}
                y={y + 4}
                textAnchor="end"
                style={{ fontSize: 10, fill: 'rgba(0,0,0,0.55)' }}
              >
                {fmtY(Math.round(t * maxValue))}
              </text>
            </g>
          )
        })}

      {labels.map((label, i) => {
        const groupX = pad.left + i * (groupW + groupGap)
        return (
          <g key={label}>
            {stacked ? (
              (() => {
                const x = groupX + (groupW - barW) / 2
                let accH = 0
                return series.map((s, si) => {
                  const v = Number(s.data[i]) || 0
                  const h = (v / maxValue) * plotH
                  const y = pad.top + (plotH - accH - h)
                  accH += h
                  const shouldLabel = showValueLabels && v > 0
                  const labelInside = h >= 14
                  return (
                    <g key={s.name}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx="6"
                        fill={s.color}
                        opacity={0.95}
                      />
                      {shouldLabel && labelInside && (
                        <text
                          x={x + barW / 2}
                          y={y + h / 2 + 4}
                          textAnchor="middle"
                          style={{ fontSize: 12, fill: '#fff', fontWeight: 800 }}
                        >
                          {fmtLabel(v)}
                        </text>
                      )}
                      {shouldLabel && !labelInside && (
                        <text
                          x={x + barW / 2}
                          y={Math.max(pad.top + 12, y - 4)}
                          textAnchor="middle"
                          style={{ fontSize: 11, fill: 'rgba(0,0,0,0.72)', fontWeight: 800 }}
                        >
                          {fmtLabel(v)}
                        </text>
                      )}
                    </g>
                  )
                })
              })()
            ) : (
              series.map((s, si) => {
                const v = Number(s.data[i]) || 0
                const h = (v / maxValue) * plotH
                const x = groupX + si * (barW + barGap)
                const y = pad.top + (plotH - h)
                return (
                  <rect
                    key={s.name}
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx="6"
                    fill={s.color}
                    opacity={0.95}
                  />
                )
              })
            )}
            <text
              x={groupX + groupW / 2}
              y={pad.top + plotH + 26}
              textAnchor="middle"
              style={{ fontSize: 11, fill: 'rgba(0,0,0,0.65)' }}
            >
              {label}
            </text>
          </g>
        )
      })}

      {tooltip && activeIdx != null && (
        <g>
          {(() => {
            const x =
              pad.left +
              activeIdx * stepForX +
              groupWForX / 2
            const boxW = 180
            const boxH = 96
            const boxX = Math.max(
              pad.left + 8,
              Math.min(x - boxW / 2, pad.left + plotW - boxW - 8),
            )
            const boxY = pad.top + 64
            const title =
              tooltipTitleFormatter?.(labels[activeIdx], activeIdx) ??
              labels[activeIdx]

            return (
              <>
                <line
                  x1={x}
                  y1={pad.top}
                  x2={x}
                  y2={pad.top + plotH}
                  stroke="rgba(0,0,0,0.35)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />

                <rect
                  x={boxX}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx="10"
                  fill="#fff"
                  stroke="rgba(0,0,0,0.08)"
                />

                <text
                  x={boxX + 14}
                  y={boxY + 28}
                  style={{ fontSize: 14, fontWeight: 800, fill: 'rgba(0,0,0,0.8)' }}
                >
                  {title}
                </text>

                {series.map((s, si) => {
                  const v = Number(s.data[activeIdx]) || 0
                  const rowY = boxY + 54 + si * 20
                  return (
                    <g key={s.name}>
                      <circle cx={boxX + 18} cy={rowY - 4} r="6" fill={s.color} />
                      <text
                        x={boxX + 34}
                        y={rowY}
                        style={{ fontSize: 13, fill: 'rgba(0,0,0,0.58)' }}
                      >
                        {s.name}:{' '}
                        <tspan style={{ fontWeight: 800, fill: 'rgba(0,0,0,0.75)' }}>
                          {fmt(v)}
                        </tspan>
                      </text>
                    </g>
                  )
                })}
              </>
            )
          })()}
        </g>
      )}

      {/* Hit area for hover tooltip */}
      {tooltip && (
        <rect
          x={pad.left}
          y={pad.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            const svg = e.currentTarget.ownerSVGElement
            const rect = svg.getBoundingClientRect()
            const localX = e.clientX - rect.left
            const idx = Math.round((localX - pad.left) / stepForX)
            setHoverIdx(idx)
          }}
        />
      )}
    </svg>
  )
}

function buildStepPath(points) {
  if (points.length === 0) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    d += ` H ${b.x} V ${b.y}`
  }
  return d
}

function buildStepAreaPath(points, baseY) {
  if (points.length === 0) return ''
  let d = `M ${points[0].x} ${baseY} L ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    d += ` H ${b.x} V ${b.y}`
  }
  d += ` L ${points[points.length - 1].x} ${baseY} Z`
  return d
}

export function StepAreaChart({
  labels,
  series,
  height = 280,
  maxValue = 70,
  showGrid = true,
  tooltip = true,
  valueFormatter,
}) {
  const width = 760
  const pad = { top: 18, right: 18, bottom: 44, left: 56 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const baseY = pad.top + plotH

  const fmt = valueFormatter ?? ((v) => `${v}`)

  const ticks = 7
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => i / ticks)

  const stepX = labels.length > 1 ? plotW / (labels.length - 1) : plotW

  function yFor(v) {
    const n = Number(v) || 0
    return pad.top + (1 - n / maxValue) * plotH
  }

  const seriesPts = series.map((s) => {
    const pts = labels.map((_, i) => ({
      x: pad.left + i * stepX,
      y: yFor(s.data[i]),
      v: Number(s.data[i]) || 0,
    }))
    return { ...s, pts }
  })

  const [hoverIdx, setHoverIdx] = React.useState(1)

  const activeIdx = Math.max(0, Math.min(labels.length - 1, hoverIdx))
  const activeX = pad.left + activeIdx * stepX

  const totals = series.reduce((acc, s) => acc + (Number(s.total) || 0), 0)
  void totals

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Income vs expense chart"
      style={{ overflow: 'visible' }}
    >
      {showGrid &&
        yTicks.map((t) => {
          const y = pad.top + (1 - t) * plotH
          return (
            <g key={t}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + plotW}
                y2={y}
                stroke="rgba(0,0,0,0.14)"
                strokeDasharray="2 3"
                strokeWidth="1"
              />
              <text
                x={pad.left - 10}
                y={y + 4}
                textAnchor="end"
                style={{ fontSize: 12, fill: 'rgba(0,0,0,0.55)' }}
              >
                ${Math.round(t * maxValue)}k
              </text>
            </g>
          )
        })}

      {seriesPts.map((s) => (
        <g key={s.name}>
          <path d={buildStepAreaPath(s.pts, baseY)} fill={s.fill ?? s.color} opacity={0.12} />
        </g>
      ))}

      {seriesPts.map((s) => (
        <g key={s.name}>
          <path d={buildStepPath(s.pts)} fill="none" stroke={s.color} strokeWidth="2.5" />
        </g>
      ))}

      {labels.map((lab, i) => (
        <text
          key={lab}
          x={pad.left + i * stepX}
          y={pad.top + plotH + 28}
          textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
          style={{ fontSize: 14, fill: 'rgba(0,0,0,0.65)' }}
        >
          {lab}
        </text>
      ))}

      {tooltip && labels.length > 0 && (
        <g>
          <line
            x1={activeX}
            y1={pad.top}
            x2={activeX}
            y2={baseY}
            stroke="rgba(0,0,0,0.35)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {seriesPts.map((s) => {
            const p = s.pts[activeIdx]
            return (
              <g key={s.name}>
                <circle cx={p.x} cy={p.y} r="10" fill={s.color} opacity="0.18" />
                <circle cx={p.x} cy={p.y} r="6" fill={s.color} stroke="#fff" strokeWidth="2" />
              </g>
            )
          })}

          {(() => {
            const boxW = 170
            const boxH = 92
            const boxX = Math.max(pad.left + 8, Math.min(activeX + 16, pad.left + plotW - boxW - 8))
            const boxY = pad.top + 76
            return (
              <g>
                <rect
                  x={boxX}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx="10"
                  fill="#fff"
                  stroke="rgba(0,0,0,0.08)"
                />
                <text x={boxX + 14} y={boxY + 28} style={{ fontSize: 16, fontWeight: 800, fill: '#000' }}>
                  {labels[activeIdx]}
                </text>
                {seriesPts.map((s, si) => {
                  const v = s.pts[activeIdx].v
                  return (
                    <g key={s.name}>
                      <circle cx={boxX + 18} cy={boxY + 50 + si * 22} r="6" fill={s.color} />
                      <text x={boxX + 34} y={boxY + 55 + si * 22} style={{ fontSize: 14, fill: 'rgba(0,0,0,0.6)' }}>
                        {s.name}:{' '}
                        <tspan style={{ fontWeight: 800, fill: 'rgba(0,0,0,0.75)' }}>{fmt(v)}</tspan>
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })()}
        </g>
      )}

      <rect
        x={pad.left}
        y={pad.top}
        width={plotW}
        height={plotH}
        fill="transparent"
        onMouseMove={(e) => {
          if (!tooltip) return
          const svg = e.currentTarget.ownerSVGElement
          const rect = svg.getBoundingClientRect()
          const localX = e.clientX - rect.left
          const idx = Math.round((localX - pad.left) / stepX)
          setHoverIdx(idx)
        }}
      />
    </svg>
  )
}
