import { useMemo, useState } from 'react';
import SlideSidebar from '../components/SlideSidebar';
import useColumnVisibility from '../hooks/useColumnVisibility';
import '../assets/css/addModalShared.css';
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  school: 'Select',
  academicYear: 'Select',
  className: 'Select',
  section: 'Select',
  activity: 'Select',
};

const columnOptions = [
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'studentName', label: 'Student' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'activity', label: 'Activity' },
  { key: 'activityDate', label: 'Date' },
];

const StudentActivityReport = () => {
  const [data, setData] = useState([]); // Initialized as empty array
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  // Filtering Logic handling search and dropdown filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch = !q || Object.values(row).some((v) => String(v).toLowerCase().includes(q));
      const matchesSchool = filters.school === 'Select' || row.school === filters.school;
      const matchesYear = filters.academicYear === 'Select' || row.academicYear === filters.academicYear;
      const matchesClass = filters.className === 'Select' || row.className === filters.className;
      const matchesSection = filters.section === 'Select' || row.section === filters.section;
      const matchesActivity = filters.activity === 'Select' || row.activity === filters.activity;
      
      return matchesSearch && matchesSchool && matchesYear && matchesClass && matchesSection && matchesActivity;
    });
  }, [data, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [currentPage, filtered, rowsPerPage]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setFilters(pendingFilters);
    setIsFilterSidebarOpen(false);
    setCurrentPage(1);
  };

  const renderCell = (row, column) => {
    const value = row[column.key];
    
    if (column.key === 'studentName') {
      return <span className="fw-medium text-primary-light">{value || '--'}</span>;
    }
    if (column.key === 'activity') {
      return (
        <span className="px-12 py-4 radius-4 fw-medium text-sm bg-info-100 text-info-600">
          {value || '--'}
        </span>
      );
    }
    
    return value || '--';
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Student Activity Report</h1>
          <span className="text-secondary-light">Dashboard / Student Activity Report</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              
              {/* Export Dropdown with established classes */}
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {/* Filter Sidebar Trigger */}
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search activities..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th scope="col" key={col.key}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">No records found.</td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && <td key={col.key}>{renderCell(row, col)}</td>)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 2), currentPage + 1)
                .map((p) => (
                  <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Student Activity" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">School</label>
            <select className="form-control form-select" value={pendingFilters.school} onChange={(e) => setPendingFilters(p => ({ ...p, school: e.target.value }))}>
              <option value="Select">All Schools</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">Academic Year</label>
            <select className="form-control form-select" value={pendingFilters.academicYear} onChange={(e) => setPendingFilters(p => ({ ...p, academicYear: e.target.value }))}>
              <option value="Select">Select Year</option>
              <option>2023-2024</option>
              <option>2024-2025</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">Class</label>
            <select className="form-control form-select" value={pendingFilters.className} onChange={(e) => setPendingFilters(p => ({ ...p, className: e.target.value }))}>
              <option value="Select">All Classes</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">Section</label>
            <select className="form-control form-select" value={pendingFilters.section} onChange={(e) => setPendingFilters(p => ({ ...p, section: e.target.value }))}>
              <option value="Select">All Sections</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">Activity</label>
            <select className="form-control form-select" value={pendingFilters.activity} onChange={(e) => setPendingFilters(p => ({ ...p, activity: e.target.value }))}>
              <option value="Select">All Activities</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={() => setPendingFilters(emptyFilters)}>Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply Filters</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default StudentActivityReport;