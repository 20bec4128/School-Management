import React from 'react';

export function ColumnPanel({ columnProps }) {
  const {
    allColumns,
    visibleColumns,
    onToggleColumn,
    columnPanelOpen,
  } = columnProps;

  if (!columnPanelOpen) {
    return null;
  }

  const isOnlyVisible = (field) => {
    return visibleColumns.length === 1 && visibleColumns.includes(field);
  };

  return (
    <div className="px-20 py-12 border-bottom border-neutral-200 tbl-toolbar-row2">
      <div className="d-flex flex-wrap align-items-center gap-8">
        {allColumns.map((column) => {
          const isVisible = visibleColumns.includes(column.field);
          const disabled = isOnlyVisible(column.field);

          return (
            <button
              key={column.field}
              type="button"
              className={`col-chip ${isVisible ? 'col-chip--on' : ''}`}
              onClick={() => !disabled && onToggleColumn(column.field)}
              disabled={disabled}
              title={disabled ? 'At least one column must be visible' : column.header}
            >
              {column.header}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ColumnPanel;
