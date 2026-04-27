import { useMemo, useState } from 'react'

const buildInitialVisibility = (columns) =>
  columns.reduce((acc, column) => {
    acc[column.key] = column.defaultVisible !== false
    return acc
  }, {})

export const useColumnVisibility = (columns, minVisible = 1) => {
  const [visibleColumns, setVisibleColumns] = useState(() => buildInitialVisibility(columns))

  const visibleColumnCount = useMemo(
    () => columns.filter((column) => visibleColumns[column.key]).length,
    [columns, visibleColumns],
  )

  const toggleColumn = (columnKey) => {
    setVisibleColumns((current) => {
      const isCurrentlyVisible = Boolean(current[columnKey])
      const currentlyVisibleCount = columns.filter((column) => current[column.key]).length
      if (isCurrentlyVisible && currentlyVisibleCount <= minVisible) return current
      return { ...current, [columnKey]: !isCurrentlyVisible }
    })
  }

  return {
    visibleColumns,
    visibleColumnCount,
    toggleColumn,
  }
}

export default useColumnVisibility
