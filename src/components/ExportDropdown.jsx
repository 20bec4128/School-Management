import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { ensurePdfTools } from '../utils/pdfAutoTable'

const textFromCell = (cell) => {
  if (!cell) return ''
  const input = cell.querySelector?.('input, textarea, select')
  if (input) {
    if (input.tagName === 'SELECT') {
      return String(input.options?.[input.selectedIndex]?.text ?? input.value ?? '').trim()
    }
    if (input.type === 'checkbox' || input.type === 'radio') {
      return input.checked ? 'Yes' : 'No'
    }
    return String(input.value ?? '').trim()
  }
  return String(cell.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const sanitizeFileName = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  // Windows-safe file name.
  return raw.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim()
}

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
  const [domExportAvailable, setDomExportAvailable] = useState(false)
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

  const resolveAutoFileName = () => {
    const wrapper = wrapperRef.current
    if (!wrapper) return ''

    const container = wrapper.closest('.card') || wrapper.parentElement
    const candidates = [
      container?.querySelector?.('.card-header h6'),
      container?.querySelector?.('.card-header h5'),
      container?.querySelector?.('.card-header h4'),
      container?.querySelector?.('h6'),
      container?.querySelector?.('h5'),
      container?.querySelector?.('h4'),
      document.querySelector?.('h1'),
      document.querySelector?.('h2'),
    ].filter(Boolean)

    for (const el of candidates) {
      const text = sanitizeFileName(el?.textContent)
      if (text && text.length >= 3) return text
    }

    return ''
  }

  const getDomTableExport = () => {
    const wrapper = wrapperRef.current
    if (!wrapper) return null

    // Most pages place ExportDropdown in the same "card" as the table.
    const container = wrapper.closest('.card') || wrapper.parentElement
    const table = container?.querySelector?.('table')
    if (!table) return null

    const ths = Array.from(table.querySelectorAll('thead th'))
    const headerLabels = ths
      .map((th) => String(th.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    // Drop typical non-data columns.
    const exportableHeaderIndexes = headerLabels
      .map((label, idx) => ({ label, idx }))
      .filter(({ label }) => {
        const normalized = label.toLowerCase()
        if (normalized === 'action' || normalized === 'actions') return false
        if (normalized === 's.l' || normalized === 'sl' || normalized === '#') return false
        return true
      })

    const exportColumns = exportableHeaderIndexes.map(({ label }) => label)
    if (exportColumns.length === 0) return null

    const trs = Array.from(table.querySelectorAll('tbody tr'))
    const exportRows = trs
      .map((tr) => {
        const tds = Array.from(tr.querySelectorAll('td'))
        if (tds.length === 0) return null
        const rowObj = {}
        exportableHeaderIndexes.forEach(({ label, idx }) => {
          rowObj[label] = textFromCell(tds[idx] ?? null)
        })
        return rowObj
      })
      .filter(Boolean)

    return { exportColumns, exportRows }
  }

  const baseName = sanitizeFileName(fileName) || resolveAutoFileName() || 'Export'
  const baseNameNormalized = String(baseName).replace(/\.(xlsx|xls|pdf)$/i, '')

  const exportExcel = async () => {
    if (typeof onExportExcel === 'function' && !hasBuiltInExcel) {
      const domExport = getDomTableExport()
      if (!domExport) {
        await onExportExcel()
        return
      }
      const worksheet = XLSX.utils.json_to_sheet(domExport.exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, String(sheetName || 'Sheet1'))
      XLSX.writeFile(workbook, `${baseNameNormalized}.xlsx`)
      return
    }

    if (!hasBuiltInExcel && typeof onExportExcel !== 'function') {
      const domExport = getDomTableExport()
      if (!domExport) return
      const worksheet = XLSX.utils.json_to_sheet(domExport.exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, String(sheetName || 'Sheet1'))
      XLSX.writeFile(workbook, `${baseNameNormalized}.xlsx`)
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
    XLSX.writeFile(workbook, `${baseNameNormalized}.xlsx`)
  }

  const exportPDF = async () => {
    if (typeof onExportPDF === 'function' && !hasBuiltInPDF) {
      const domExport = getDomTableExport()
      if (!domExport) {
        await onExportPDF()
        return
      }
      const { JsPDF, autoTable } = await ensurePdfTools()
      const doc = new JsPDF({ orientation: pdfOrientation })
      doc.text(String(pdfTitle || 'Export Report'), 14, 10)
      autoTable(doc, {
        head: [domExport.exportColumns],
        body: domExport.exportRows.map((row) => domExport.exportColumns.map((label) => String(row[label] ?? ''))),
        headStyles: { fillColor: [31, 41, 55] },
      })
      doc.save(`${baseNameNormalized}.pdf`)
      return
    }

    if (!hasBuiltInPDF && typeof onExportPDF !== 'function') {
      const domExport = getDomTableExport()
      if (!domExport) return
      const { JsPDF, autoTable } = await ensurePdfTools()
      const doc = new JsPDF({ orientation: pdfOrientation })
      doc.text(String(pdfTitle || 'Export Report'), 14, 10)
      autoTable(doc, {
        head: [domExport.exportColumns],
        body: domExport.exportRows.map((row) => domExport.exportColumns.map((label) => String(row[label] ?? ''))),
        headStyles: { fillColor: [31, 41, 55] },
      })
      doc.save(`${baseNameNormalized}.pdf`)
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
    doc.save(`${baseNameNormalized}.pdf`)
  }

  const canOpen = !(disabled || loading)
  const canExportExcel = Boolean(onExportExcel || hasBuiltInExcel || domExportAvailable)
  const canExportPDF = Boolean(onExportPDF || hasBuiltInPDF || domExportAvailable)

  return (
    <div className={`dropdown ${className}`.trim()} ref={wrapperRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-expanded={open}
        disabled={!canOpen}
        onClick={() => {
          if (!canOpen) return
          if (!open) {
            setDomExportAvailable(Boolean(getDomTableExport()))
          }
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
