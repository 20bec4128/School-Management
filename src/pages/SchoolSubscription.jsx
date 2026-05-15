import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import WizardPopup from "../components/WizardPopup";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import "../assets/css/addModalShared.css";
import ExportDropdown from '../components/ExportDropdown'

const STEPS = ["Subscription Details"];

const emptyForm = {
  planName: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  schoolName: "",
  startDate: "",
  endDate: "",
  status: "Active",
};

const FIELD_ICONS = {
  "Plan Name": "ri-medal-line",
  Name: "ri-user-line",
  Email: "ri-mail-line",
  Phone: "ri-phone-line",
  Address: "ri-map-pin-line",
  "School Name": "ri-school-line",
  "Start Date": "ri-calendar-line",
  "End Date": "ri-calendar-todo-line",
  Status: "ri-toggle-line",
};

const columnOptions = [
  { key: "schoolName", label: "School Name" },
  { key: "planName", label: "Plan Name" },
  { key: "price", label: "Price" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status" },
];

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#667085",
            zIndex: 1,
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const SchoolSubscription = () => {
  const [data, setData] = useState([
    {
      id: 1,
      schoolName: "Windsor Park High School",
      planName: "Premium",
      price: "5000",
      name: "John Doe",
      email: "john@windsor.edu",
      phone: "0123456789",
      status: "Active",
    },
    {
      id: 2,
      schoolName: "Green Valley School",
      planName: "Standard",
      price: "2500",
      name: "Jane Smith",
      email: "jane@greenvalley.edu",
      phone: "9876543210",
      status: "Active",
    },
  ]);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch =
        !q ||
        row.schoolName?.toLowerCase().includes(q) ||
        row.planName?.toLowerCase().includes(q) ||
        row.name?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [data, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [currentPage, filteredData, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SchoolSubscriptions");
    XLSX.writeFile(wb, "School_Subscription_List.xlsx");
  };

  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">School Subscription</h1>
          <span className="text-secondary-light">Subscription / School Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line"></i> Add Subscription
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />

              <button className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
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

              <select className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
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
                      <label className="form-check-label">#SL</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.id)} onChange={() => setSelectedRows(prev => prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id])} />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>
                          {col.key === "status" ? (
                            <span className={`px-12 py-4 radius-4 fw-medium text-sm ${row[col.key] === "Active" ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}>
                              {row[col.key]}
                            </span>
                          ) : col.key === "schoolName" ? (
                            <span className="fw-medium text-primary-light">{row[col.key]}</span>
                          ) : row[col.key]}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"><i className="ri-edit-line"></i></button>
                          <button className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"><i className="ri-delete-bin-line"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? "btn btn-sm btn-primary-600" : "btn btn-sm btn-light border"} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="800px"
        open={isModalOpen}
        title={editingId ? "Edit Subscription" : "Add Subscription"}
        steps={STEPS}
        step={0}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => setIsModalOpen(false)}
        submitLabel={editingId ? "Update" : "Save"}
      >
        <div className="avm-grid">
          <FormField label="Plan Name" required>
            <select className="avm-input form-select" id="planName" value={formData.planName} onChange={handleInputChange}>
              <option value="">--Select--</option>
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </FormField>

          <FormField label="Name" required>
            <input type="text" className="avm-input" id="name" placeholder="Name" value={formData.name} onChange={handleInputChange} />
          </FormField>

          <FormField label="Email" required>
            <input type="email" className="avm-input" id="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
          </FormField>

          <FormField label="Phone" required>
            <input type="text" className="avm-input" id="phone" placeholder="Phone" value={formData.phone} onChange={handleInputChange} />
          </FormField>

          <FormField label="Address" required full>
            <input type="text" className="avm-input" id="address" placeholder="Address" value={formData.address} onChange={handleInputChange} />
          </FormField>

          <FormField label="School Name" required>
            <input type="text" className="avm-input" id="schoolName" placeholder="School Name" value={formData.schoolName} onChange={handleInputChange} />
          </FormField>

          <FormField label="Start Date" required>
            <input type="date" className="avm-input" id="startDate" value={formData.startDate} onChange={handleInputChange} />
          </FormField>

          <FormField label="End Date" required>
            <input type="date" className="avm-input" id="endDate" value={formData.endDate} onChange={handleInputChange} />
          </FormField>

          <FormField label="Status" required>
            <select className="avm-input form-select" id="status" value={formData.status} onChange={handleInputChange}>
              <option value="">--Select--</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Subscription">
        <form className="p-20 d-grid gap-16">
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Status</label>
            <select className="form-control form-select">
              <option value="Select">--Select Status--</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary-600 w-100">Apply Filter</button>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default SchoolSubscription;
