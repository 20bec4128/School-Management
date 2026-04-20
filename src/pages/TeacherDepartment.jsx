import React from 'react';
import { useDataTable } from '../hooks/useDataTable';
import { TableToolbar, FilterPanel, ColumnPanel, TablePagination } from '../components/table';

const columns = [
  { field: 'sl',     header: 'SL',     sortable: true,  filterType: 'number' },
  { field: 'school', header: 'School', sortable: true,  filterType: 'text'   },
  { field: 'title',  header: 'Title',  sortable: true,  filterType: 'text'   },
  { field: 'note',   header: 'Note',   sortable: false, filterType: 'text'   },
  { field: 'action', header: 'Action', sortable: false                        },
];

const sampleData = [
  { sl: 1, school: 'ABC School',      title: 'Principal',      note: 'Main admin'       },
  { sl: 2, school: 'XYZ School',      title: 'Vice Principal', note: ''                 },
  { sl: 3, school: 'DEF Academy',     title: 'Head Teacher',   note: 'Department head'  },
  { sl: 4, school: 'GHI College',     title: 'Senior Teacher', note: 'Experienced staff'},
  { sl: 5, school: 'JKL High School', title: 'Teacher',        note: ''                 },
];

function TeacherDepartment() {
  const { tableProps, toolbarProps, filterProps, columnProps, paginationProps } =
    useDataTable(sampleData, columns, {
      defaultRowsPerPage: 10,
      searchFields: ['school', 'title', 'note'],
      exportFileName: 'teacher-department',
    });

  const handleSort = (field, sortable) => {
    if (!sortable) return;
    const nextOrder =
      tableProps.sortField === field
        ? tableProps.sortOrder === 1 ? -1 : 1
        : 1;
    tableProps.onSort({ sortField: field, sortOrder: nextOrder });
  };

  const sortIndicator = (field) => {
    if (tableProps.sortField !== field)
      return <span className="text-secondary-light ms-4" style={{ fontSize: 11 }}>↑↓</span>;
    return (
      <span className="text-primary-600 ms-4" style={{ fontSize: 11 }}>
        {tableProps.sortOrder === 1 ? '↑' : '↓'}
      </span>
    );
  };

  const actionTemplate = (rowData) => (
    <div className="d-flex align-items-center gap-10">
      <button
        type="button"
        className="bg-success-100 text-success-600 bg-hover-success-200 d-flex align-items-center gap-1 px-12 py-5-px text-sm fw-medium radius-8 border-0"
      >
        <i className="ri-edit-2-line"></i> Edit
      </button>
      <button
        type="button"
        className="bg-danger-100 text-danger-600 bg-hover-danger-200 d-flex align-items-center gap-1 px-12 py-5-px text-sm fw-medium radius-8 border-0"
      >
        <i className="ri-delete-bin-6-line"></i> Delete
      </button>
    </div>
  );

  const visibleNonSl = columnProps.renderedColumns.filter(c => c.field !== 'sl');

  return (
    <div className="dashboard-main-body">

      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h6 className="fw-semibold mb-4 text-primary-light">Teacher Department</h6>
          <p className="text-secondary-light text-sm mb-0">
            Manage school teacher departments and roles
          </p>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6">
          <i className="ri-add-large-line text-md"></i>
          Add New
        </button>
      </div>

      {/* Card */}
      <div className="card h-100">
        <div className="card-body p-0">

          {/* Row 2 — Toolbar */}
          <TableToolbar toolbarProps={toolbarProps} />

          {/* Column panel */}
          <ColumnPanel columnProps={columnProps} />

          {/* Filter panel */}
          <FilterPanel filterProps={filterProps} />

          {/* Table */}
          <div className="table-responsive">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={tableProps.selectAll || false}
                        onChange={(e) =>
                          tableProps.onSelectAllChange &&
                          tableProps.onSelectAllChange({ checked: e.target.checked })
                        }
                      />
                      <label className="form-check-label">SL</label>
                    </div>
                  </th>
                  {visibleNonSl.map((col) => (
                    <th
                      key={col.field}
                      scope="col"
                      onClick={() => handleSort(col.field, col.sortable)}
                      style={{
                        cursor: col.sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                    >
                      {col.header}
                      {col.sortable ? sortIndicator(col.field) : null}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tableProps.value.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleNonSl.length + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  tableProps.value.map((row) => (
                    <tr key={row.sl}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={
                              tableProps.selection?.some((s) => s.sl === row.sl) || false
                            }
                            onChange={() => {}}
                          />
                          <label className="form-check-label">
                            {String(row.sl).padStart(2, '0')}
                          </label>
                        </div>
                      </td>
                      {visibleNonSl.map((col) => (
                        <td key={col.field}>
                          {col.field === 'action'
                            ? actionTemplate(row)
                            : row[col.field] || (
                                <span className="text-secondary-light">—</span>
                              )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination paginationProps={paginationProps} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default TeacherDepartment;