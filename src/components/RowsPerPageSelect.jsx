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

const RowsPerPageSelect = ({ value, onChange, className, options = [10, 20] }) => {
  const normalized = normalizeValue(value)
  const optionValues = Array.from(new Set((Array.isArray(options) ? options : [10, 20]).map(normalizeValue)))

  const selectValue = useMemo(() => {
    if (optionValues.includes(normalized)) return String(normalized)
    return `custom:${normalized}`
  }, [normalized, optionValues])

  return (
    <select
      className={className}
      value={selectValue}
      onChange={(e) => {
        const v = String(e.target.value || '')
        const selected = Number(v)
        if (Number.isFinite(selected) && optionValues.includes(selected)) return onChange(selected)
        if (v === 'custom') {
          const next = readCustomSize(normalized)
          if (next != null) onChange(next)
          return
        }
        if (v.startsWith('custom:')) return
      }}
      >
      {optionValues.map((option) => (
        <option key={option} value={String(option)}>
          {option}
        </option>
      ))}
      {!optionValues.includes(normalized) ? <option value={`custom:${normalized}`}>Custom ({normalized})</option> : null}
      <option value="custom">Custom...</option>
    </select>
  )
}

export default RowsPerPageSelect
