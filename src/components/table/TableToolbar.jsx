import React, { useEffect, useRef, useState } from 'react';

export function TableToolbar({ toolbarProps }) {
  const {
    globalSearch,
    onSearchChange,
    rowsPerPage,
    onRowsPerPageChange,
    filterPanelOpen,
    toggleFilterPanel,
    columnPanelOpen,
    toggleColumnPanel,
    onExportCSV,
    onExportXLS,
    onExportPDF,
    selectedCount,
    hasActiveFilters,
  } = toolbarProps;

  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200 bg-neutral-50"
    >
      <div className="d-flex align-items-center gap-2">
        <div className="position-relative" ref={exportRef}>
          <button
            className="btn btn-sm radius-8 fw-semibold"
            style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', color: 'var(--primary-800)' }}
            onClick={() => setExportOpen(prev => !prev)}
          >
            <i className="ri-download-2-line me-1"></i>
            Export
            <i className="ri-arrow-down-s-line ms-1"></i>
          </button>
          {exportOpen && (
            <div
              className="card radius-8 shadow-1"
              style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 150, zIndex: 50, overflow: 'hidden', padding: 0 }}
            >
              <button
                className="btn btn-sm text-start w-100 radius-0"
                style={{ color: 'var(--success-700)' }}
                onClick={() => { onExportCSV(); setExportOpen(false); }}
              >
                <i className="ri-file-text-line me-2"></i>Export CSV
              </button>
              <button
                className="btn btn-sm text-start w-100 radius-0"
                style={{ color: 'var(--primary-700)' }}
                onClick={() => { onExportXLS(); setExportOpen(false); }}
              >
                <i className="ri-file-excel-2-line me-2"></i>Export XLS
              </button>
              <button
                className="btn btn-sm text-start w-100 radius-0"
                style={{ color: 'var(--danger-700)' }}
                onClick={() => { onExportPDF(); setExportOpen(false); }}
              >
                <i className="ri-file-pdf-line me-2"></i>Export PDF
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className={`px-12 py-5-px border radius-8 d-flex align-items-center gap-8 text-sm ${
            columnPanelOpen
              ? 'btn-tbl-active'
              : 'border-neutral-300 text-secondary-light'
          }`}
          onClick={toggleColumnPanel}
        >
          <i className="ri-layout-column-line text-md line-height-1"></i>
          Columns
        </button>

      </div>

      <div className="d-flex align-items-center gap-2"> <div className="position-relative">
          <i className="ri-search-line position-absolute top-50 translate-middle-y text-muted" style={{ left: 10, fontSize: 14 }}></i>
          <input
            type="text"
            className="form-control form-control-sm radius-8"
            placeholder="Search..."
            value={globalSearch}
            onChange={e => onSearchChange(e.target.value)}
            style={{ paddingLeft: 30, minWidth: 180 }}
          />
        </div>
        <div className="d-flex align-items-center gap-1 text-sm text-muted">
          Show
          <select
            className="form-select form-select-sm radius-8"
            style={{ width: 'auto' }}
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          rows
        </div>

        <button
          type="button"
          className={`px-12 py-5-px border radius-8 d-flex align-items-center gap-8 text-sm position-relative ${
            filterPanelOpen || hasActiveFilters
              ? 'btn-tbl-active'
              : 'border-neutral-300 text-secondary-light'
          }`}
          onClick={toggleFilterPanel}
        >
          <i className="ri-filter-3-line text-md line-height-1"></i>
          Filter
          {hasActiveFilters && <span className="filter-dot" />}
        </button>

        {selectedCount > 0 && (
          <span className="badge-selected">
            {selectedCount} selected
          </span>
        )}
      </div>
    </div>
  );
}

export default TableToolbar;
