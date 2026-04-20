import React from 'react';

export function FilterPanel({ filterProps }) {
  const {
    columns,
    pendingFilters,
    onPendingFilterChange,
    onApplyFilters,
    onResetFilters,
    activeFilterTags,
    onRemoveFilter,
    filterPanelOpen,
  } = filterProps;

  if (!filterPanelOpen) {
    // Show active filter tags even when panel is closed
    if (activeFilterTags.length === 0) {
      return null;
    }

    return (
      <div className="d-flex flex-wrap align-items-center gap-8 px-20 py-8 border-bottom border-neutral-200">
        <span className="text-sm text-secondary-light">Active filters:</span>
        {activeFilterTags.map((tag) => (
          <span key={tag.field} className="filter-tag">
            {tag.label}: {tag.value}
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-600)', lineHeight: 1, padding: 0 }}
              onClick={() => onRemoveFilter(tag.field)}
            >
              <i className="ri-close-line"></i>
            </button>
          </span>
        ))}
      </div>
    );
  }

  // Filterable columns
  const filterableColumns = columns.filter(col => col.filterType);

  return (
    <>
      {activeFilterTags.length > 0 && (
        <div className="d-flex flex-wrap align-items-center gap-8 px-20 py-8 border-bottom border-neutral-200">
          <span className="text-sm text-secondary-light">Active filters:</span>
          {activeFilterTags.map((tag) => (
            <span key={tag.field} className="filter-tag">
              {tag.label}: {tag.value}
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-600)', lineHeight: 1, padding: 0 }}
                onClick={() => onRemoveFilter(tag.field)}
              >
                <i className="ri-close-line"></i>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="px-20 py-16 border-bottom border-neutral-200 tbl-toolbar-row2">
        <div className="row g-3">
          {filterableColumns.map((column) => {
            const filterValue = pendingFilters[column.field]?.value || '';

            return (
              <div key={column.field} className="col-md-3 col-sm-6">
                <label className="form-label small text-muted mb-1">
                  {column.header}
                </label>
                
                {column.filterType === 'text' && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={filterValue}
                    onChange={(e) => onPendingFilterChange(column.field, e.target.value)}
                  />
                )}

                {column.filterType === 'dropdown' && (
                  <select
                    className="form-select form-select-sm"
                    value={filterValue}
                    onChange={(e) => onPendingFilterChange(column.field, e.target.value)}
                  >
                    <option value="">All</option>
                    {column.filterOptions?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {column.filterType === 'number' && (
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">Min</span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={filterValue}
                      onChange={(e) => onPendingFilterChange(column.field, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="d-flex justify-content-end gap-8 mt-16">
          <button
            type="button"
            className="btn btn-danger-200 text-danger-600 px-20 py-8 radius-8"
            onClick={onResetFilters}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-primary-600 px-20 py-8 radius-8"
            onClick={onApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

export default FilterPanel;
