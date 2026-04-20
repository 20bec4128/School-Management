const ProgressRing = ({
  value,
  size = 52,
  stroke = 6,
  color = '#2F6BFF',
  trackOpacity = 0.18,
  label,
}) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c
  const offset = c * (1 - v / 100)

  return (
    <div className="sm-ring" style={{ width: size, height: size }} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeOpacity={trackOpacity}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={dash}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="56%"
          textAnchor="middle"
          style={{
            fontSize: 14,
            fontWeight: 800,
            fill: 'rgba(0,0,0,0.78)',
          }}
        >
          {v}
        </text>
      </svg>
    </div>
  )
}

export default ProgressRing

