import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import WizardPopup from '../components/WizardPopup';
import SlideSidebar from '../components/SlideSidebar';
import useColumnVisibility from '../hooks/useColumnVisibility';
import '../assets/css/addModalShared.css';

/** * 1. Configuration & Constants
 */
const emptyForm = {
  schoolId: '',
  userType: '',
  issueTo: '',
  categoryId: '',
  assetId: '',
  quantity: '',
  issueDate: '',
  checkIn: '',
  note: '',
};

const emptyFilters = {
  school: 'Select',
  userType: 'Select',
  category: 'Select',
};

const STEPS = ['Basic Information'];

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'User Type': 'ri-user-settings-line',
  'Issue To': 'ri-user-voice-line',
  'Category': 'ri-list-settings-line',
  'Asset': 'ri-computer-line',
  'Quantity': 'ri-equalizer-line',
  'Issue Date': 'ri-calendar-line',
  'Check In': 'ri-calendar-check-line',
  'Note': 'ri-sticky-note-line',
};

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'category', label: 'Category' },
  { key: 'asset', label: 'Asset' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'userType', label: 'User Type' },
  { key: 'issueTo', label: 'Issue To' },
  { key: 'checkIn', label: 'Check In' },
  { key: 'checkOut', label: 'Check Out' },
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

const AssetIssue = () => {
  /** * 2. State Management
   */
  const [data, setData] = useState([]); 
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "AssetIssues");
    XLSX.writeFile(workbook, "Asset_Issue_Report.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Asset Issue Report", 14, 10);
    doc.autoTable({
      head: [['S.L', ...columnOptions.filter(c => visibleColumns[c.key]).map(col => col.label)]],
      body: filteredData.map((row, i) => [
        i + 1, 
        ...columnOptions.filter(c => visibleColumns[c.key]).map(col => row[col.key])
      ]),
      headStyles: { fillColor: [31, 41, 55] },
    });
    doc.save('Asset_Issue_Report.pdf');
  };

  const renderForm = () => (
    <div className="avm-grid">
      <FormField label="School Name" required full>
        <select className="avm-select" value={addForm.schoolId} onChange={(e) => setAddForm({...addForm, schoolId: e.target.value})}>
          <option value="">--Select School--</option>
        </select>
      </FormField>

      <FormField label="User Type" required>
        <select className="avm-select" value={addForm.userType} onChange={(e) => setAddForm({...addForm, userType: e.target.value})}>
          <option value="">--Select--</option>
        </select>
      </FormField>

      <FormField label="Issue To" required>
        <select className="avm-select" value={addForm.issueTo} onChange={(e) => setAddForm({...addForm, issueTo: e.target.value})}>
          <option value="">--Select--</option>
        </select>
      </FormField>

      <FormField label="Category" required>
        <select className="avm-select" value={addForm.categoryId} onChange={(e) => setAddForm({...addForm, categoryId: e.target.value})}>
          <option value="">--Select--</option>
        </select>
      </FormField>

      <FormField label="Asset" required>
        <select className="avm-select" value={addForm.assetId} onChange={(e) => setAddForm({...addForm, assetId: e.target.value})}>
          <option value="">--Select--</option>
        </select>
      </FormField>

      <FormField label="Quantity" required full>
        <input type="number" className="avm-input" placeholder="Quantity" value={addForm.quantity} onChange={(e) => setAddForm({...addForm, quantity: e.target.value})} />
      </FormField>

      <FormField label="Issue Date" required>
        <input type="date" className="avm-input" value={addForm.issueDate} onChange={(e) => setAddForm({...addForm, issueDate: e.target.value})} />
      </FormField>

      <FormField label="Check In" required>
        <input type="date" className="avm-input" value={addForm.checkIn} onChange={(e) => setAddForm({...addForm, checkIn: e.target.value})} />
      </FormField>

      <FormField label="Note" full>
        <textarea className="avm-input avm-textarea" rows="3" placeholder="Note" value={addForm.note} onChange={(e) => setAddForm({...addForm, note: e.target.value})}></textarea>
      </FormField>
    </div>
  );

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Asset Issue</h1>
          <span className="text-secondary-light">Asset / Issue Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={() => setIsAddOpen(true)}>
          <i className="ri-add-large-line"></i> Add Issue
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {/* Persistent Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10" onClick={handleExportExcel}><i className="ri-file-excel-2-line"></i> Excel</button></li>
                  <li><button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10" onClick={handleExportPDF}><i className="ri-file-3-line"></i> PDF</button></li>
                </ul>
              </div>

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
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search issues..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
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
                          {col.key === 'asset' ? <span className="fw-medium text-primary-light">{row[col.key]}</span> : row[col.key]}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button className="bg-info-focus bg-hover-info-200 text-info-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"><i className="ri-edit-line"></i></button>
                          <button className="bg-danger-focus bg-hover-danger-200 text-danger-600 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"><i className="ri-delete-bin-line"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
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

      <WizardPopup modalWidth="680px" open={isAddOpen} title="Add Asset Issue" steps={STEPS} step={0} onClose={() => setIsAddOpen(false)} onSubmit={() => setIsAddOpen(false)} submitLabel="Save">
        {renderForm()}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Asset Issue">
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

export default AssetIssue;