const RowsPerPageSelect = ({ value, onChange, className = '' }) => {
  const selectClassName = [
    'form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <select
      className={selectClassName}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      <option value="5">5</option>
      <option value="10">10</option>
      <option value="20">20</option>
      <option value="50">50</option>
    </select>
  )
}

export default RowsPerPageSelect
