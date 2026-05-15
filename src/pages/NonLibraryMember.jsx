import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SlideSidebar from '../components/SlideSidebar';
import useColumnVisibility from '../hooks/useColumnVisibility';
import '../assets/css/addModalShared.css';
import ExportDropdown from '../components/ExportDropdown'

/** * 1. Configuration & Constants
 */
const emptyForm = {
  schoolId: '',
  classId: '',
  sectionId: '',
  studentId: '',
  note: '',
};

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  section: 'Select',
};

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Class': 'ri-building-line',
  'Section': 'ri-layout-grid-line',
  'Student': 'ri-user-add-line',
  'Note': 'ri-sticky-note-line',
};

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'photo', label: 'Photo' },
  { key: 'studentName', label: 'Name' },
  { key: 'className', label: 'Class' },
  { key: 'sectionName', label: 'Section' },
  { key: 'rollNo', label: 'Roll No' },
];

/**
 * Standardized FormField wrapper with absolute positioned Remix Icons
 */
const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line';
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span style={{ 
          position: 'absolute', 
          left: '0.85rem', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: '#667085', 
          fontSize: '0.95rem', 
          zIndex: 1 
        }}>
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const NonLibraryMember = () => {
  /** * 2. State Management
   */
  const [data, setData] = useState([]); // Initialized empty
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  
  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  /** * 3. Logic: Filtering & Pagination
   */
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch = !q || Object.values(row).some((v) => String(v).toLowerCase().includes(q));
      const matchesSchool = filters.school === 'Select' || row.school === filters.school;
      return matchesSearch && matchesSchool;
    });
  }, [data, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [currentPage, filteredData, rowsPerPage]);

  /** * 4. Export Logic
   */
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "NonLibraryMembers");
    XLSX.writeFile(workbook, "Non_Library_Members.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Non-Library Member Report", 14, 10);
    doc.autoTable({
      head: [['S.L', ...columnOptions.filter(c => visibleColumns[c.key]).map(col => col.label)]],
      body: filteredData.map((row, i) => [
        i + 1, 
        ...columnOptions.filter(c => visibleColumns[c.key]).map(col => row[col.key])
      ]),
      headStyles: { fillColor: [31, 41, 55] },
    });
    doc.save('Non_Library_Members.pdf');
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Non-Library Member</h1>
          <span className="text-secondary-light">Library / Member Management</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Persistent Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              
              <ExportDropdown
                rows={filteredData}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                fileName="NonLibraryMember_List"
                sheetName="Non Library Members"
                pdfTitle="Non Library Member Report"
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
              />

              <button className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map(col => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
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
                  {columnOptions.map(col => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td>
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
                        <td key={col.key}>
                          {col.key === 'photo' ? (
                            <img src={row[col.key] || 'https://placehold.co/40x40'} alt="student" className="w-40-px h-40-px rounded-circle" />
                          ) : col.key === 'studentName' ? (
                            <span className="fw-medium text-primary-light">{row[col.key]}</span>
                          ) : row[col.key]}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button className="bg-success-focus bg-hover-success-200 text-success-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Add to Library"><i className="ri-user-add-line"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} – {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries</span>
            <div className="d-flex align-items-center gap-8">
              <button className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              <button className="btn btn-sm btn-primary-600">{currentPage}</button>
              <button className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Student">
        <form className="p-20 d-grid gap-16" onSubmit={(e) => { e.preventDefault(); setIsFilterSidebarOpen(false); }}>
          <FormField label="School Name">
            <select className="avm-select" value={filters.school} onChange={(e) => setFilters({ ...filters, school: e.target.value })}>
              <option value="Select">All Schools</option>
            </select>
          </FormField>
          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={() => setFilters(emptyFilters)}>Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply Filter</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default NonLibraryMember;
