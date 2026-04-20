import React from 'react';
import { useDataTable } from '../hooks/useDataTable';
import { TableToolbar, FilterPanel, ColumnPanel, TablePagination } from '../components/table';

const columns = [
  { 
    field: 'sl', 
    header: 'SL', 
    sortable: true,
    filterType: 'number'
  },
  { 
    field: 'school', 
    header: 'School', 
    sortable: true,
    filterType: 'text'
  },
  { 
    field: 'title', 
    header: 'Title', 
    sortable: true,
    filterType: 'text'
  },
  { 
    field: 'note', 
    header: 'Note', 
    sortable: false,
    filterType: 'text'
  },
  { 
    field: 'action', 
    header: 'Action', 
    sortable: false
  },
];

const sampleData = [
  { sl: 1, school: 'ABC School', title: 'Principal', note: 'Main admin' },
  { sl: 2, school: 'XYZ School', title: 'Vice Principal', note: '' },
  { sl: 3, school: 'DEF Academy', title: 'Head Teacher', note: 'Department head' },
  { sl: 4, school: 'GHI College', title: 'Senior Teacher', note: 'Experienced staff' },
  { sl: 5, school: 'JKL High School', title: 'Teacher', note: '' },
];

function TeacherDepartment() {
  const { tableProps, toolbarProps, filterProps, columnProps, paginationProps } = 
    useDataTable(sampleData, columns, {
      defaultRowsPerPage: 10,
      searchFields: ['school', 'title', 'note'],
      exportFileName: 'teacher-department'
    });

  const handleSort = (field, sortable) => {
    if (!sortable) return;

    const nextOrder =
      tableProps.sortField === field ? (tableProps.sortOrder === 1 ? -1 : 1) : 1;

    tableProps.onSort({ sortField: field, sortOrder: nextOrder });
  };

  const sortIndicator = (field) => {
    if (tableProps.sortField !== field) return <span className="ms-2 text-muted">↑↓</span>;
    return (
      <span className="ms-2">
        {tableProps.sortOrder === 1 ? '↑' : '↓'}
      </span>
    );
  };

  const actionTemplate = (rowData) => (
    <div className="d-flex gap-2">
      <button className="btn btn-sm btn-primary">Edit</button>
      <button className="btn btn-sm btn-danger">Delete</button>
    </div>
  );

  return (
    <div className="p-3">
      <div
        className="d-flex align-items-center justify-content-between mb-0"
        style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border-color)' }}
      >
        <div>
          <h6 className="fw-semibold mb-0">Teacher Department</h6>
          <p className="text-sm text-secondary-light mb-0 mt-1">Manage school teacher departments and roles</p>
        </div>
        <button className="btn btn-primary btn-sm radius-8 fw-semibold">
          <i className="ri-add-line me-1"></i> Add New
        </button>
      </div>
      <TableToolbar toolbarProps={toolbarProps} />
      <FilterPanel filterProps={filterProps} />
      <ColumnPanel columnProps={columnProps} />
      
      <div className="basic-data-table">
        <div className="table-responsive">
          <table className="table dataTable mb-0">
            <thead className="table-heading-dark-mode">
              <tr>
                {columnProps.renderedColumns.map((col) => (
                  <th
                    key={col.field}
                    role={col.sortable ? 'button' : undefined}
                    onClick={() => handleSort(col.field, col.sortable)}
                    style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                  >
                    {col.header}
                    {col.sortable ? sortIndicator(col.field) : null}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableProps.value.map((row) => (
                <tr key={row.sl}>
                  {columnProps.renderedColumns.map((col) => (
                    <td key={col.field}>
                      {col.field === 'action' ? actionTemplate(row) : row[col.field]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <TablePagination paginationProps={paginationProps} />
    </div>
  );
}

export default TeacherDepartment;
