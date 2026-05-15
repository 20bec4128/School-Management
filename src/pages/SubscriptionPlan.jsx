import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import WizardPopup from "../components/WizardPopup";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import "../assets/css/addModalShared.css";
import ExportDropdown from '../components/ExportDropdown'

const STEPS = ["Plan Details"];

const emptyForm = {
  planName: "",
  price: "",
  studentLimit: "",
  guardianLimit: "",
  teacherLimit: "",
  employeeLimit: "",
  status: "Active",
};

const FIELD_ICONS = {
  "Plan Name": "ri-medal-line",
  Price: "ri-money-dollar-circle-line",
  "Student Limit": "ri-user-star-line",
  "Guardian Limit": "ri-parent-line",
  "Teacher Limit": "ri-user-voice-line",
  "Employee Limit": "ri-team-line",
  Status: "ri-toggle-line",
};

const columnOptions = [
  { key: "planName", label: "Plan Name" },
  { key: "price", label: "Price" },
  { key: "studentLimit", label: "Student Limit" },
  { key: "guardianLimit", label: "Guardian Limit" },
  { key: "teacherLimit", label: "Teacher Limit" },
  { key: "employeeLimit", label: "Employee Limit" },
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

const SubscriptionPlan = () => {
  const [data, setData] = useState([
    {
      id: 1,
      planName: "Basic",
      price: "1000",
      studentLimit: "100",
      guardianLimit: "200",
      teacherLimit: "10",
      employeeLimit: "5",
      status: "Active",
    },
    {
      id: 2,
      planName: "Standard",
      price: "2500",
      studentLimit: "500",
      guardianLimit: "1000",
      teacherLimit: "50",
      employeeLimit: "20",
      status: "Active",
    },
    {
      id: 3,
      planName: "Premium",
      price: "5000",
      studentLimit: "Unlimited",
      guardianLimit: "Unlimited",
      teacherLimit: "100",
      employeeLimit: "50",
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
        row.planName?.toLowerCase().includes(q) ||
        row.price?.toString().includes(q);
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
    XLSX.utils.book_append_sheet(wb, ws, "SubscriptionPlans");
    XLSX.writeFile(wb, "Subscription_Plan_List.xlsx");
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Subscription Plan</h1>
          <span className="text-secondary-light">Subscription / Plan Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line"></i> Add Plan
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
                          ) : col.key === "planName" ? (
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
        modalWidth="700px"
        open={isModalOpen}
        title={editingId ? "Edit Plan" : "Add Plan"}
        steps={STEPS}
        step={0}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => setIsModalOpen(false)}
        submitLabel={editingId ? "Update" : "Save"}
      >
        <div className="avm-grid">
          <FormField label="Plan Name" required full>
            <input type="text" className="avm-input" id="planName" placeholder="Enter plan name" value={formData.planName} onChange={handleInputChange} />
          </FormField>

          <FormField label="Price" required>
            <input type="number" className="avm-input" id="price" placeholder="Enter price" value={formData.price} onChange={handleInputChange} />
          </FormField>

          <FormField label="Student Limit" required>
            <input type="text" className="avm-input" id="studentLimit" placeholder="Enter student limit" value={formData.studentLimit} onChange={handleInputChange} />
          </FormField>

          <FormField label="Guardian Limit" required>
            <input type="text" className="avm-input" id="guardianLimit" placeholder="Enter guardian limit" value={formData.guardianLimit} onChange={handleInputChange} />
          </FormField>

          <FormField label="Teacher Limit" required>
            <input type="text" className="avm-input" id="teacherLimit" placeholder="Enter teacher limit" value={formData.teacherLimit} onChange={handleInputChange} />
          </FormField>

          <FormField label="Employee Limit" required>
            <input type="text" className="avm-input" id="employeeLimit" placeholder="Enter employee limit" value={formData.employeeLimit} onChange={handleInputChange} />
          </FormField>

          <FormField label="Status" required>
            <select className="avm-input form-select" id="status" value={formData.status} onChange={handleInputChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Plan">
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

export default SubscriptionPlan;
