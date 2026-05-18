import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import WizardPopup from '../components/WizardPopup';
import SlideSidebar from '../components/SlideSidebar';
import FindEmptyState from '../components/FindEmptyState';
import useColumnVisibility from '../hooks/useColumnVisibility';
import useAcademicYearOptions from '../hooks/useAcademicYearOptions';
import '../assets/css/addModalShared.css';
import ExportDropdown from '../components/ExportDropdown'

/** * 1. Configuration & Constants
 */
const emptyFilters = {
  schoolId: 'Select',
  academicYear: 'Select',
  paymentMethod: 'Select',
  startDate: '',
  endDate: '',
};

const columnOptions = [
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'paymentDate', label: 'Payment date' },
  { key: 'amount', label: 'Amount' },
  { key: 'balance', label: 'Balance' },
];

const FIELD_ICONS = {
  'School': 'ri-school-line',
  'Academic Year': 'ri-calendar-line',
  'Payment Method': 'ri-bank-card-line',
  'Start Date': 'ri-calendar-event-line',
  'End Date': 'ri-calendar-check-line',
};

const FormField = ({ label, required, children }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line';
  return (
    <div className="avm-field full">
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#667085', fontSize: '0.95rem', zIndex: 1 }}>
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const DailyTransactionReport = () => {
  /** * 2. State Management
   */
  const [data, setData] = useState([]); // Initialized empty per standard
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);
  const academicYearOptions = useAcademicYearOptions();

  /** * 3. Filtering & Reporting Logic
   */
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch = !q || Object.values(row).some((v) => String(v).toLowerCase().includes(q));
      const matchesMethod = filters.paymentMethod === 'Select' || row.paymentMethod === filters.paymentMethod;
      const matchesSchool = filters.schoolId === 'Select' || row.schoolId === filters.schoolId;
      return matchesSearch && matchesMethod && matchesSchool;
    });
  }, [data, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [currentPage, filteredData, rowsPerPage]);

  /** * 4. Cell Rendering & Color Logic
   */
  const renderCell = (row, column) => {
    const value = row[column.key];
    if (column.key === 'amount') return <span className="fw-medium text-primary-light">${value}</span>;
    if (column.key === 'balance') return <span className="text-danger-600 fw-medium">${value}</span>;
    return value || '--';
  };

  /** * 5. Export Logic
   */
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Daily Transaction Report", 14, 10);
    doc.autoTable({
      head: [columnOptions.map(col => col.label)],
      body: filteredData.map(row => columnOptions.map(col => row[col.key])),
    });
    doc.save('Daily_Transactions.pdf');
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "Daily_Transactions.xlsx");
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Daily Transaction Report</h1>
          <span className="text-secondary-light">Reporting / Financials</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export Dropdown */}
              <ExportDropdown onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} />

              {/* Filter Sidebar Trigger */}
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
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
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map(col => visibleColumns[col.key] && (
                    <th scope="col" key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      {data.length === 0 
                        ? "No transactions found. Please use the 'Filter' button to search." 
                        : "No results found for the current search/filter."}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map(col => visibleColumns[col.key] && (
                        <td key={col.key}>{renderCell(row, col)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{' '}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
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

      {/* SlideSidebar for Filtering */}
      <SlideSidebar 
        isOpen={isFilterSidebarOpen} 
        onClose={() => setIsFilterSidebarOpen(false)} 
        title="Find Transactions"
      >
        <div className="p-20 d-grid gap-16">
          <FormField label="School" required>
            <select className="avm-select" value={pendingFilters.schoolId} onChange={e => setPendingFilters({...pendingFilters, schoolId: e.target.value})}>
              <option value="Select">Select School</option>
            </select>
          </FormField>

          <FormField label="Academic Year">
            <select className="avm-select" value={pendingFilters.academicYear} onChange={e => setPendingFilters({...pendingFilters, academicYear: e.target.value})}>
              <option value="Select">Select Year</option>
              {academicYearOptions.map((year) => <option key={year}>{year}</option>)}
            </select>
          </FormField>

          <FormField label="Payment Method">
            <select className="avm-select" value={pendingFilters.paymentMethod} onChange={e => setPendingFilters({...pendingFilters, paymentMethod: e.target.value})}>
              <option value="Select">All Methods</option>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Card</option>
            </select>
          </FormField>

          <FormField label="Start Date">
            <input type="date" className="avm-input" value={pendingFilters.startDate} onChange={e => setPendingFilters({...pendingFilters, startDate: e.target.value})} />
          </FormField>

          <FormField label="End Date">
            <input type="date" className="avm-input" value={pendingFilters.endDate} onChange={e => setPendingFilters({...pendingFilters, endDate: e.target.value})} />
          </FormField>

          <div className="d-flex gap-8 mt-12">
            <button className="btn btn-danger-200 text-danger-600 w-100" onClick={() => setPendingFilters(emptyFilters)}>Reset</button>
            <button className="btn btn-primary-600 w-100" onClick={() => { setFilters(pendingFilters); setIsFilterSidebarOpen(false); setCurrentPage(1); }}>Apply Filter</button>
          </div>
        </div>
      </SlideSidebar>
    </div>
  );
};

export default DailyTransactionReport;
