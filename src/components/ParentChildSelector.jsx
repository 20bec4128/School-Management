import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

const getChildId = (c) => c?.studentId ?? c?.id ?? c?.student?.id ?? null
const getChildName = (c) => c?.name ?? c?.studentName ?? c?.fullName ?? c?.student?.name ?? c?.student?.fullName ?? ''

export default function ParentChildSelector() {
  const { parentChildren, selectedChildId, setSelectedChildId } = useAuth()

  const options = useMemo(() => {
    const rows = Array.isArray(parentChildren) ? parentChildren : []
    return rows
      .map((c) => ({ id: getChildId(c), name: getChildName(c) }))
      .filter((c) => c.id != null)
  }, [parentChildren])

  if (options.length <= 1) return null

  return (
    <div className="d-flex align-items-center gap-8">
      <span className="text-secondary-light text-sm">Child:</span>
      <select
        className="form-select form-select-sm"
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

