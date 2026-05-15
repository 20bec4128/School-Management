import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { ensurePdfTools } from '../utils/pdfAutoTable'

const ExportDropdown = ({
  title = 'Export',
  rows = [],
  loadRows,
  columns = [],
  visibleColumns = null,
  mapRow,
  fileName = 'Export',
  sheetName = 'Sheet1',
  pdfTitle = 'Export Report',
  pdfOrientation = 'landscape',
  onExportExcel,
  onExportPDF,
  disabled = false,
  loading = false,
  className = '',
  buttonClassName = 'px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white',
  menuClassName = 'dropdown-menu p-12 border bg-base shadow',
  extraActions = [],
}) => {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const hasBuiltInExcel = Array.isArray(columns) && columns.length > 0 && (Array.isArray(rows) || typeof loadRows === 'function')
  const hasBuiltInPDF = hasBuiltInExcel

  useEffect(() => {
    void ensurePdfTools()
  }, [])

  useEffect(() => {
    const onMouseDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const handleAction = async (action) => {
    if (typeof action?.onClick !== 'function') return
    try {
      await action.onClick()
    } finally {
      setOpen(false)
    }
  }

  const getVisibleColumns = () => {
    const cols = Array.isArray(columns) ? columns : []
    if (!visibleColumns) return cols
    return cols.filter((column) => visibleColumns[column.key] !== false)
  }

  const getSourceRows = async () => {
    if (typeof loadRows === 'function') {
      const loaded = await loadRows()
      return Array.isArray(loaded) ? loaded : []
    }
    return Array.isArray(rows) ? rows : []
  }

  const baseName = String(fileName || 'Export').replace(/\.(xlsx|xls|pdf)$/i, '')

  const exportExcel = async () => {
    if (typeof onExportExcel === 'function' && !hasBuiltInExcel) {
      await onExportExcel()
      return
    }
    const sourceRows = await getSourceRows()
    const exportColumns = getVisibleColumns()
    const exportRows = sourceRows.map((row, index) => {
      const source = typeof mapRow === 'function' ? mapRow(row, index) ?? row : row
      return exportColumns.reduce((acc, column) => {
        const value = source?.[column.key]
        acc[column.label] = value == null ? '' : value
        return acc
      }, {})
    })
    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, String(sheetName || 'Sheet1'))
    XLSX.writeFile(workbook, `${baseName}.xlsx`)
  }

  const exportPDF = async () => {
    if (typeof onExportPDF === 'function' && !hasBuiltInPDF) {
      await onExportPDF()
      return
    }
    const { JsPDF, autoTable } = await ensurePdfTools()
    const exportColumns = getVisibleColumns()
    const sourceRows = await getSourceRows()
    const exportRows = sourceRows.map((row, index) => {
      const source = typeof mapRow === 'function' ? mapRow(row, index) ?? row : row
      return exportColumns.reduce((acc, column) => {
        const value = source?.[column.key]
        acc[column.label] = value == null ? '' : value
        return acc
      }, {})
    })
    const doc = new JsPDF({ orientation: pdfOrientation })
    doc.text(String(pdfTitle || 'Export Report'), 14, 10)
    autoTable(doc, {
      head: [exportColumns.map((column) => column.label)],
      body: exportRows.map((row) => exportColumns.map((column) => String(row[column.label] ?? ''))),
      headStyles: { fillColor: [31, 41, 55] },
    })
    doc.save(`${baseName}.pdf`)
  }

  const canOpen = !(disabled || loading)
  const canExportExcel = Boolean(onExportExcel || hasBuiltInExcel)
  const canExportPDF = Boolean(onExportPDF || hasBuiltInPDF)

  return (
    <div className={`dropdown ${className}`.trim()} ref={wrapperRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-expanded={open}
        disabled={!canOpen}
        onClick={() => {
          if (!canOpen) return
          setOpen((prev) => !prev)
        }}
      >
        <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
          <i className="ri-file-upload-line text-md line-height-1"></i> {title}
        </span>
        <span>
          <i className="ri-arrow-down-s-line"></i>
        </span>
      </button>
      {open ? (
        <ul className={`${menuClassName} show`}>
          {canExportExcel ? (
            <li>
              <button
                type="button"
                className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"
                onClick={async () => {
                  await exportExcel()
                  setOpen(false)
                }}
                disabled={!canOpen}
              >
                <i className="ri-file-excel-2-line"></i> Excel
              </button>
            </li>
          ) : null}
          {canExportPDF ? (
            <li>
              <button
                type="button"
                className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"
                onClick={async () => {
                  await exportPDF()
                  setOpen(false)
                }}
                disabled={!canOpen}
              >
                <i className="ri-file-3-line"></i> PDF
              </button>
            </li>
          ) : null}
          {extraActions.map((action) => (
            <li key={action.key || action.label}>
              <button
                type="button"
                className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"
                onClick={() => void handleAction(action)}
                disabled={!canOpen || action.disabled}
              >
                {action.icon ? <i className={action.icon}></i> : null}
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default ExportDropdown
