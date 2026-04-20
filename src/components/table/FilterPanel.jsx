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
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span className="text-muted small">Active filters:</span>
        {activeFilterTags.map((tag) => (
          <span
            key={tag.field}
            className="filter-tag"
          >
            {tag.label}: {tag.value}
            <button
              type="button"
              className="btn-close btn-close-sm p-0 ms-1"
              style={{ fontSize: '0.5rem' }}
              onClick={() => onRemoveFilter(tag.field)}
              aria-label="Remove filter"
            ></button>
          </span>
        ))}
      </div>
    );
  }

  // Filterable columns
  const filterableColumns = columns.filter(col => col.filterType);

  return (
    <div className="card tbl-panel mb-3">
        {/* Active filter tags */}
        {activeFilterTags.length > 0 && (
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="text-muted small">Active filters:</span>
            {activeFilterTags.map((tag) => (
              <span
                key={tag.field}
                className="filter-tag"
              >
                {tag.label}: {tag.value}
                <button
                  type="button"
                  className="btn-close btn-close-sm p-0 ms-1"
                  style={{ fontSize: '0.5rem' }}
                  onClick={() => onRemoveFilter(tag.field)}
                  aria-label="Remove filter"
                ></button>
              </span>
            ))}
          </div>
        )}

        {/* Filter fields */}
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

        {/* Action buttons */}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onResetFilters}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onApplyFilters}
          >
            Apply Filters
          </button>
        </div>
    </div>
  );
}

export default FilterPanel;
