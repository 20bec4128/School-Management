import { useMemo } from 'react'
import { useAuth } from '../context/useAuth'

const getChildId = (c) => c?.studentId ?? c?.id ?? c?.student?.id ?? null
const getChildName = (c) => c?.name ?? c?.studentName ?? c?.fullName ?? c?.student?.name ?? c?.student?.fullName ?? ''

export default function ParentChildSelector({
  className = '',
  labelClassName = '',
  selectClassName = '',
  showLabel = true,
  variant = 'default',
}) {
  const { parentChildren, selectedChildId, setSelectedChildId } = useAuth()

  const options = useMemo(() => {
    const rows = Array.isArray(parentChildren) ? parentChildren : []
    return rows
      .map((c) => ({ id: getChildId(c), name: getChildName(c) }))
      .filter((c) => c.id != null)
  }, [parentChildren])

  if (options.length <= 1) return null

  if (variant === 'topbar') {
    return (
      <div className="sm-topbar__select-shell sm-topbar__select-shell--child">
        <span className="sm-topbar__select-icon">
          <iconify-icon icon="ri-team-line" />
        </span>
        <select
          className={`sm-topbar__select-input${selectClassName ? ` ${selectClassName}` : ''}`.trim()}
          value={selectedChildId || ''}
          onChange={(e) => setSelectedChildId(e.target.value || null)}
          aria-label="Select child"
        >
          <option value="">All children</option>
          {options.map((o) => (
            <option key={String(o.id)} value={String(o.id)}>
              {o.name ? `${o.name} (${o.id})` : String(o.id)}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className={`d-flex align-items-center gap-8 ${className}`.trim()}>
      {showLabel ? <span className={`text-secondary-light text-sm ${labelClassName}`.trim()}>Child:</span> : null}
      <select
        className={`form-select form-select-sm ${selectClassName}`.trim()}
        style={{ width: 220 }}
        value={selectedChildId || ''}
        onChange={(e) => setSelectedChildId(e.target.value || null)}
      >
        <option value="">-- Select --</option>
        {options.map((o) => (
          <option key={String(o.id)} value={String(o.id)}>
            {o.name ? `${o.name} (${o.id})` : String(o.id)}
          </option>
        ))}
      </select>
    </div>
  )
}
