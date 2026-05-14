import { useMemo } from 'react'

const normalizeValue = (value) => {
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return n
  return 10
}

const readCustomSize = (current) => {
  const raw = window.prompt('Enter number of records per page', String(current > 0 ? current : 10))
  if (raw == null) return null
  const n = Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

const RowsPerPageSelect = ({ value, onChange, className }) => {
  const normalized = normalizeValue(value)

  const selectValue = useMemo(() => {
    if (normalized === 10) return '10'
    if (normalized === 20) return '20'
    return `custom:${normalized}`
  }, [normalized])

  return (
    <select
      className={className}
      value={selectValue}
      onChange={(e) => {
        const v = String(e.target.value || '')
        if (v === '10') return onChange(10)
        if (v === '20') return onChange(20)
        if (v === 'custom') {
          const next = readCustomSize(normalized)
          if (next != null) onChange(next)
          return
        }
        if (v.startsWith('custom:')) return
      }}
      >
      <option value="10">10</option>
      <option value="20">20</option>
      {normalized !== 10 && normalized !== 20 ? <option value={`custom:${normalized}`}>Custom ({normalized})</option> : null}
      <option value="custom">Custom...</option>
    </select>
  )
}

export default RowsPerPageSelect
