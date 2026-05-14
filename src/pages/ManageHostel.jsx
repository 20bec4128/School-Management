import React, { useState, useMemo, useCallback, useEffect } from "react";
import WizardPopup from "../components/WizardPopup";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import "../assets/css/addModalShared.css";

const STEPS = ["Basic Info"];

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Name: "ri-hotel-line",
  "Hostel Type": "ri-community-line",
  Address: "ri-map-pin-line",
  Note: "ri-sticky-note-line",
};

const columnOptions = [
  { key: "school", label: "School" },
  { key: "name", label: "Hostel" },
  { key: "type", label: "Hostel Type" },
  { key: "address", label: "Address" },
];

const emptyForm = {
  schoolId: "",
  name: "",
  type: "",
  address: "",
  note: "",
};

const emptyFilters = {
  schoolId: "Select",
  type: "Select",
};

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

const ManageHostel = ({ onNavigate }) => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [addStep, setAddStep] = useState(0);
  const [editStep, setEditStep] = useState(0);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch =
        !q ||
        row.name?.toLowerCase().includes(q) ||
        row.address?.toLowerCase().includes(q) ||
        row.school?.toLowerCase().includes(q);
      const matchesSchool =
        filters.schoolId === "Select" || row.schoolId === filters.schoolId;
      const matchesType =
        filters.type === "Select" || row.type === filters.type;
      return matchesSearch && matchesSchool && matchesType;
    });
  }, [data, search, filters]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [currentPage, filteredData, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  const handleInputChange = (setter) => (e) => {
    const { id, value } = e.target;
    setter((prev) => ({ ...prev, [id]: value }));
  };

  const openAdd = () => {
    setAddForm(emptyForm);
    setAddStep(0);
    setIsAddOpen(true);
  };

  const openEdit = (row) => {
    setEditForm({
      schoolId: row.schoolId || "",
      name: row.name || "",
      type: row.type || "",
      address: row.address || "",
      note: row.note || "",
    });
    setEditStep(0);
    setIsEditOpen(true);
  };

  const renderForm = (form, setter) => (
    <div className="avm-grid">
      <FormField label="School Name" required full>
        <select
          className="avm-select"
          id="schoolId"
          value={form.schoolId}
          onChange={handleInputChange(setter)}
        >
          <option value="">--Select School--</option>
          <option value="1">Windsor Park High School</option>
        </select>
      </FormField>

      <FormField label="Name" required full>
        <input
          type="text"
          className="avm-input"
          id="name"
          placeholder="Name"
          value={form.name}
          onChange={handleInputChange(setter)}
        />
      </FormField>

      <FormField label="Hostel Type" required full>
        <select
          className="avm-select"
          id="type"
          value={form.type}
          onChange={handleInputChange(setter)}
        >
          <option value="">--Select--</option>
          <option value="Boys">Boys</option>
          <option value="Girls">Girls</option>
          <option value="Mixed">Mixed</option>
        </select>
      </FormField>

      <FormField label="Address" required full>
        <input
          type="text"
          className="avm-input"
          id="address"
          placeholder="Address"
          value={form.address}
          onChange={handleInputChange(setter)}
        />
      </FormField>

      <FormField label="Note" full>
        <textarea
          rows={4}
          className="avm-input avm-textarea"
          id="note"
          placeholder="Note"
          value={form.note}
          onChange={handleInputChange(setter)}
        />
      </FormField>
    </div>
  );

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Manage Hostel</h1>
          <span className="text-secondary-light">Hostel / Manage Hostel</span>
        </div>
        <button
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate("hostel-create") : openAdd())}
        >
          <i className="ri-add-large-line"></i> Add Hostel
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
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
                  <li><button className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"><i className="ri-file-excel-2-line"></i> Excel</button></li>
                </ul>
              </div>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 30].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                  {columnOptions.map(
                    (col) =>
                      visibleColumns[col.key] && (
                        <th key={col.key}>{col.label}</th>
                      ),
                  )}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" />
                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === "name" ? (
                                <span className="fw-medium text-primary-light">
                                  {row[col.key]}
                                </span>
                              ) : (
                                row[col.key]
                              )}
                            </td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEdit(row)}>
                            <i className="ri-edit-line"></i>
                          </button>
                          <button className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0">
                            <i className="ri-delete-bin-line"></i>
                          </button>
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
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{" "}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <button type="button" className="btn btn-sm btn-primary-600">{currentPage}</button>
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isAddOpen}
        title="Add Hostel"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderForm(addForm, setAddForm)}
      </WizardPopup>

      {/* Edit Modal */}
      <WizardPopup
        modalWidth="540px"
        open={isEditOpen}
        title="Edit Hostel"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderForm(editForm, setEditForm)}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find Hostel"
      >
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault();
            setIsFilterSidebarOpen(false);
          }}
        >
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">
              School
            </label>
            <select
              className="form-control form-select"
              value={filters.schoolId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, schoolId: e.target.value }))
              }
            >
              <option value="Select">--Select School--</option>
              <option value="1">Windsor Park High School</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">
              Hostel Type
            </label>
            <select
              className="form-control form-select"
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              <option value="Select">--Select Type--</option>
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => setFilters(emptyFilters)}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default ManageHostel;
