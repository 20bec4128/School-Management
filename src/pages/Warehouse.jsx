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
  warehouseName: '',
  warehouseKeeper: '',
  email: '',
  phone: '',
  address: '',
  note: '',
};

const emptyFilters = {
  school: 'Select',
};

const STEPS = ['Basic Information'];

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Name': 'ri-home-gear-line',
  'Warehouse Keeper': 'ri-user-settings-line',
  'Email': 'ri-mail-line',
  'Phone': 'ri-phone-line',
  'Address': 'ri-map-pin-line',
  'Note': 'ri-sticky-note-line',
};

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'warehouseName', label: 'Name' },
  { key: 'warehouseKeeper', label: 'Warehouse Keeper' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
];

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line';
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
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

const Warehouse = () => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouses");
    XLSX.writeFile(workbook, "Warehouse_List.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Warehouse Report", 14, 10);
    doc.autoTable({
      head: [['S.L', ...columnOptions.filter(c => visibleColumns[c.key]).map(col => col.label)]],
      body: filteredData.map((row, i) => [
        i + 1, 
        ...columnOptions.filter(c => visibleColumns[c.key]).map(col => row[col.key])
      ]),
      headStyles: { fillColor: [31, 41, 55] },
    });
    doc.save('Warehouse_Report.pdf');
  };

  const renderForm = () => (
    <div className="avm-grid">
      <FormField label="School Name" required full>
        <select className="avm-select" id="schoolId" value={addForm.schoolId} onChange={(e) => setAddForm({...addForm, schoolId: e.target.value})}>
          <option value="">--Select School--</option>
          <option value="1">Windsor Park High School</option>
        </select>
      </FormField>
      <FormField label="Name" required full>
        <input type="text" className="avm-input" id="warehouseName" placeholder="Name" value={addForm.warehouseName} onChange={(e) => setAddForm({...addForm, warehouseName: e.target.value})} />
      </FormField>
      <FormField label="Warehouse Keeper" full>
        <input type="text" className="avm-input" id="warehouseKeeper" placeholder="Warehouse Keeper" value={addForm.warehouseKeeper} onChange={(e) => setAddForm({...addForm, warehouseKeeper: e.target.value})} />
      </FormField>
      <FormField label="Email">
        <input type="email" className="avm-input" id="email" placeholder="Email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} />
      </FormField>
      <FormField label="Phone">
        <input type="text" className="avm-input" id="phone" placeholder="Phone" value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})} />
      </FormField>
      <FormField label="Address" full>
        <input type="text" className="avm-input" id="address" placeholder="Address" value={addForm.address} onChange={(e) => setAddForm({...addForm, address: e.target.value})} />
      </FormField>
      <FormField label="Note" full>
        <textarea className="avm-input avm-textarea" id="note" rows="3" placeholder="Note" value={addForm.note} onChange={(e) => setAddForm({...addForm, note: e.target.value})}></textarea>
      </FormField>
    </div>
  );

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Warehouse</h1>
          <span className="text-secondary-light">Inventory / Warehouse Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={() => setIsAddOpen(true)}>
          <i className="ri-add-large-line"></i> Add Warehouse
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              
              {/* Export Dropdown */}
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

              {/* Column Customizer */}
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
                        <td key={col.key}>{col.key === 'warehouseName' ? <span className="fw-medium text-primary-light">{row[col.key]}</span> : row[col.key]}</td>
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

          <div className="d-flex align-items-center justify-content-between px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} – {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}</span>
            <div className="d-flex align-items-center gap-8">
              <button className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              <button className="btn btn-sm btn-primary-600">{currentPage}</button>
              <button className="btn btn-sm btn-light border" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup modalWidth="650px" open={isAddOpen} title="Add Warehouse" steps={STEPS} step={0} onClose={() => setIsAddOpen(false)} onSubmit={() => setIsAddOpen(false)} submitLabel="Save">
        {renderForm()}
      </WizardPopup>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Warehouse">
        <form className="p-20 d-grid gap-16" onSubmit={(e) => { e.preventDefault(); setIsFilterSidebarOpen(false); }}>
          <FormField label="School Name">
            <select className="avm-select" value={filters.school} onChange={(e) => setFilters({ school: e.target.value })}>
              <option value="Select">All Schools</option>
              <option value="1">Windsor Park High School</option>
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

export default Warehouse;
