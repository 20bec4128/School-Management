import { useEffect, useMemo, useRef, useState } from "react";
import WizardPopup from "../components/WizardPopup";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import "../assets/css/addModalShared.css";

const emptyForm = {
  school: "",
  className: "",
  student: "",
  feeType: "",
  feeAmount: "",
  month: "",
  isDiscount: "",
  paidStatus: "",
  note: "",
};

const emptyFilters = {
  school: "Select",
  className: "Select",
  month: "Select",
  feeType: "Select",
  paidStatus: "Select",
};

// Steps for the Wizard: 0 for Single, 1 for Bulk
const STEPS = ["Create Invoice", "Create Bulk Invoice"];

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Class: "ri-building-line",
  Student: "ri-user-line",
  "Fee Type": "ri-money-dollar-circle-line",
  "Fee Amount": "ri-bank-card-line",
  Month: "ri-calendar-line",
  "Is Applicable Discount?": "ri-percent-line",
  "Paid Status": "ri-checkbox-circle-line",
  Note: "ri-sticky-note-line",
};

const columnOptions = [
  { key: "school", label: "School" },
  { key: "invoiceNumber", label: "Invoice Number" },
  { key: "student", label: "Student / Sale To" },
  { key: "month", label: "Month" },
  { key: "grossAmount", label: "Gross Amount" },
  { key: "discount", label: "Discount" },
  { key: "netAmount", label: "Net Amount" },
  { key: "dueAmount", label: "Due Amount" },
  { key: "status", label: "Status" },
];

const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const sanitizeCell = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replaceAll('"', '""');
};

const getExportColumns = (visibleColumns) =>
  columnOptions.filter((column) => visibleColumns[column.key]);

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#667085",
            fontSize: "0.95rem",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const ManageInvoice = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: Single, 1: Bulk
  const [form, setForm] = useState(emptyForm);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [columnOpen, setColumnOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const columnMenuRef = useRef(null);
  const exportMenuRef = useRef(null);

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  useEffect(() => {
    const handler = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setColumnOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch =
        !q ||
        Object.values(row).some((v) => String(v).toLowerCase().includes(q));
      
      const matchesSchool = filters.school === "Select" || row.school === filters.school;
      const matchesClass = filters.className === "Select" || row.className === filters.className;
      const matchesMonth = filters.month === "Select" || row.month === filters.month;
      const matchesFeeType = filters.feeType === "Select" || row.feeType === filters.feeType;
      const matchesStatus = filters.paidStatus === "Select" || row.status === filters.paidStatus;

      return matchesSearch && matchesSchool && matchesClass && matchesMonth && matchesFeeType && matchesStatus;
    });
  }, [data, search, filters]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [currentPage, filtered, rowsPerPage]);

  const totalVisibleColumns = useMemo(
    () => getExportColumns(visibleColumns).length,
    [visibleColumns],
  );

  const exportData = useMemo(
    () => filtered.map((row) => {
      const record = {};
      getExportColumns(visibleColumns).forEach((column) => {
        record[column.label] = row?.[column.key] ?? "";
      });
      return record;
    }),
    [filtered, visibleColumns],
  );

  const handleExportCSV = () => {
    const cols = getExportColumns(visibleColumns);
    if (cols.length === 0) return;

    const header = cols.map((col) => `"${sanitizeCell(col.label)}"`).join(",");
    const rows = exportData.map((record) =>
      cols.map((col) => `"${sanitizeCell(record[col.label])}"`).join(","),
    );
    downloadTextFile(
      "manage-invoice.csv",
      [header, ...rows].join("\n"),
      "text/csv;charset=utf-8",
    );
  };

  const handleExportXLS = async () => {
    const cols = getExportColumns(visibleColumns);
    if (cols.length === 0) return;

    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, "manage-invoice.xlsx");
  };

  const handleExportPDF = async () => {
    const cols = getExportColumns(visibleColumns);
    if (cols.length === 0) return;

    const [{ default: jsPDF }, autoTable] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Manage Invoice", 14, 14);
    autoTable.default(doc, {
      startY: 20,
      head: [cols.map((col) => col.label)],
      body: exportData.map((record) => cols.map((col) => String(record[col.label] ?? ""))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [31, 41, 55] },
    });
    doc.save("manage-invoice.pdf");
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const openModal = (stepIndex) => {
    setForm(emptyForm);
    setActiveStep(stepIndex);
    setIsModalOpen(true);
  };

  const renderFormContent = () => (
    <div className="avm-grid">
      <FormField label="School Name" required full>
        <select
          className="avm-select"
          id="school"
          value={form.school}
          onChange={handleChange}
        >
          <option value="">--Select School--</option>
          <option>Windsor Park High School</option>
        </select>
      </FormField>

      <FormField label="Class" required>
        <select
          className="avm-select"
          id="className"
          value={form.className}
          onChange={handleChange}
        >
          <option value="">--Select--</option>
        </select>
      </FormField>

      {/* Student Field: Only shown in Single Invoice mode */}
      <FormField label="Student" required={activeStep === 0}>
        <select
          className="avm-select"
          id="student"
          value={form.student}
          onChange={handleChange}
        >
          <option value="">--Select--</option>
          {activeStep === 1 && <option value="all">All Students</option>}
        </select>
      </FormField>

      <FormField label="Fee Type" required>
        <select
          className="avm-select"
          id="feeType"
          value={form.feeType}
          onChange={handleChange}
        >
          <option value="">--Select--</option>
        </select>
      </FormField>

      {/* Fee Amount: Explicitly requested for Single Invoice */}
      {activeStep === 0 && (
        <FormField label="Fee Amount" required>
          <input
            type="number"
            className="avm-input"
            id="feeAmount"
            value={form.feeAmount}
            onChange={handleChange}
          />
        </FormField>
      )}

      <FormField label="Month" required>
        <select
          className="avm-select"
          id="month"
          value={form.month}
          onChange={handleChange}
        >
          <option value="">--Select--</option>
          <option>January</option>
          <option>February</option>
        </select>
      </FormField>

      <FormField label="Is Applicable Discount?" required>
        <select
          className="avm-select"
          id="isDiscount"
          value={form.isDiscount}
          onChange={handleChange}
        >
          <option value="">--Select--</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </FormField>

      <FormField label="Paid Status" required>
        <select
          className="avm-select"
          id="paidStatus"
          value={form.paidStatus}
          onChange={handleChange}
        >
          <option value="">--Select--</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </FormField>

      <FormField label="Note" full>
        <textarea
          className="avm-input avm-textarea"
          id="note"
          rows="3"
          value={form.note}
          onChange={handleChange}
          placeholder="Note"
        />
      </FormField>
    </div>
  );

  const renderCell = (row, column) => {
    const value = row?.[column.key];
    if (column.key === "status") {
      const s = String(value || "").toLowerCase();
      const badgeClass =
        s === "paid"
          ? "bg-success-100 text-success-600"
          : s === "unpaid"
            ? "bg-danger-100 text-danger-600"
            : "bg-warning-100 text-warning-600";
      return (
        <span className={`px-12 py-4 radius-4 fw-medium text-sm ${badgeClass}`}>
          {value || "--"}
        </span>
      );
    }

    if (column.key === "invoiceNumber") {
      return <span className="fw-medium text-primary-light">{value || "--"}</span>;
    }

    return value || "--";
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Manage Invoice
          </h1>
          <span className="text-secondary-light">
            Dashboard / Manage Invoice
          </span>
        </div>
        <div className="d-flex gap-12">
          <button
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={() => openModal(0)}
          >
            <i className="ri-add-line"></i> Create Invoice
          </button>
          <button
            className="btn btn-warning-600 d-flex align-items-center gap-6"
            onClick={() => openModal(1)}
          >
            <i className="ri-file-list-3-line"></i> Create Bulk Invoice
          </button>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10" onClick={handleExportCSV}>
                      <i className="ri-file-text-line"></i> CSV
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10" onClick={() => void handleExportXLS()}>
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10" onClick={() => void handleExportPDF()}>
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search invoice..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map(
                    (col) => visibleColumns[col.key] && <th scope="col" key={col.key}>{col.label}</th>,
                  )}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No invoices found.
                    </td>
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
                      {columnOptions.map(
                        (col) => visibleColumns[col.key] && <td key={col.key}>{renderCell(row, col)}</td>,
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle">
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
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {Array.from({ length: Math.max(1, Math.ceil(filtered.length / rowsPerPage)) }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 2), currentPage + 1)
                .map((p) => (
                  <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(Math.max(1, Math.ceil(filtered.length / rowsPerPage)), p + 1))} disabled={currentPage === Math.max(1, Math.ceil(filtered.length / rowsPerPage))}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <WizardPopup
        open={isModalOpen}
        title={
          activeStep === 0 ? "Create Single Invoice" : "Create Bulk Invoice"
        }
        steps={[STEPS[activeStep]]}
        step={0}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => setIsModalOpen(false)}
        modalWidth="620px"
      >
        {renderFormContent()}
      </WizardPopup>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Invoices"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters(pendingFilters);
            setIsFilterSidebarOpen(false);
          }}
        >
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  school: e.target.value,
                }))
              }
            >
              <option value="Select">All Schools</option>
              <option>Windsor Park High School</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.className}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  className: e.target.value,
                }))
              }
            >
              <option value="Select">All Classes</option>
              <option>Class 1</option>
              <option>Class 2</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Month
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.month}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  month: e.target.value,
                }))
              }
            >
              <option value="Select">All Months</option>
              <option>January</option>
              <option>February</option>
              <option>March</option>
              <option>April</option>
              <option>May</option>
              <option>June</option>
              <option>July</option>
              <option>August</option>
              <option>September</option>
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Fee Type
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.feeType}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  feeType: e.target.value,
                }))
              }
            >
              <option value="Select">All Fee Types</option>
              <option>Tuition Fee</option>
              <option>Exam Fee</option>
              <option>Transport Fee</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Paid Status
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.paidStatus}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  paidStatus: e.target.value,
                }))
              }
            >
              <option value="Select">All Status</option>
              <option>Paid</option>
              <option>Unpaid</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => setPendingFilters(emptyFilters)}
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default ManageInvoice;
