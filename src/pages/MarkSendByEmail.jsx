import { useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import ExportDropdown from "../components/ExportDropdown";
import "../assets/css/addModalShared.css";
import { useAuth } from "../context/useAuth";
import {
  fetchMarkSendEmailsPage,
  deleteMarkSendEmail,
} from "../apis/markSendEmailApi";
import { RECEIVER_TYPE_OPTIONS } from "../constants/markSendEmail";

const emptyFilters = {
  school: "Select",
  exam: "Select",
  receiverType: "Select",
  studentMark: "Select",
  subject: "Select",
};

const columnOptions = [
  { key: "schoolName", label: "School" },
  { key: "examTerm", label: "Exam" },
  { key: "receiverType", label: "Receiver Type" },
  { key: "studentMark", label: "Student Mark" },
  { key: "subject", label: "Subject" },
];

const uniqueStrings = (items) =>
  Array.from(
    new Set((items || []).map((i) => String(i ?? "").trim()).filter(Boolean)),
  ).sort();

const MarkSendByEmail = ({ onNavigate }) => {
  const { schoolId, headOfficeId } = useAuth();
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMarkSendEmailsPage({
        headOfficeId,
        schoolId,
        page: currentPage - 1,
        size: rowsPerPage,
        search: search,
      });
      setRows(data?.content || []);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      setError(err?.message || "Failed to fetch email dispatch logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, rowsPerPage, search, schoolId, headOfficeId]);

  const schoolOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.schoolName)),
    [rows],
  );
  const examOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.examTerm)),
    [rows],
  );
  const studentMarkOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.studentMark)),
    [rows],
  );
  const subjectOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.subject)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.school !== "Select" && row.schoolName !== filters.school)
        return false;
      if (filters.exam !== "Select" && row.examTerm !== filters.exam)
        return false;
      if (
        filters.receiverType !== "Select" &&
        row.receiverType !== filters.receiverType
      )
        return false;
      if (
        filters.studentMark !== "Select" &&
        row.studentMark !== filters.studentMark
      )
        return false;
      if (filters.subject !== "Select" && row.subject !== filters.subject)
        return false;
      return true;
    });
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(totalElements / rowsPerPage));

  const allSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedRows.includes(row.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [
        ...new Set([...prev, ...filteredRows.map((row) => row.id)]),
      ]);
    } else {
      setSelectedRows((prev) =>
        prev.filter((id) => !filteredRows.some((row) => row.id === id)),
      );
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target;
    setPendingFilters((prev) => ({ ...prev, [id]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setFilters(pendingFilters);
    setCurrentPage(1);
    setIsFilterSidebarOpen(false);
  };

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
  };

  const openAdd = () => {
    sessionStorage.removeItem("MARK_SEND_EMAIL_EDIT_ID");
    onNavigate?.("mark-send-email-create");
  };

  const openEdit = (row) => {
    sessionStorage.setItem("MARK_SEND_EMAIL_EDIT_ID", String(row.id));
    onNavigate?.("mark-send-email-create");
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this email history record?",
      )
    )
      return;
    try {
      await deleteMarkSendEmail(row.id);
      setSelectedRows((prev) => prev.filter((id) => id !== row.id));
      loadData();
    } catch (err) {
      alert(err?.message || "Failed to remove entry record item.");
    }
  };

  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Mark Send By Email
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Mark Send By Email</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-mail-send-line"></i>
          </span>
          Send Email
        </button>
      </div>

      {error && <div className="alert alert-danger radius-8">{error}</div>}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[column.key]}
                          onChange={() => toggleColumn(column.key)}
                        />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search dispatch records..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table
              className="table bordered-table mb-0 data-table"
              style={{ minWidth: 1000 }}
            >
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? (
                    <th scope="col">School</th>
                  ) : null}
                  {visibleColumns.examTerm ? <th scope="col">Exam</th> : null}
                  {visibleColumns.receiverType ? (
                    <th scope="col">Receiver Type</th>
                  ) : null}
                  {visibleColumns.studentMark ? (
                    <th scope="col">Student Mark</th>
                  ) : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40"
                    >
                      Loading records...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No entries found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {String(
                              idx + 1 + (currentPage - 1) * rowsPerPage,
                            ).padStart(2, "0")}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? (
                        <td className="fw-medium text-primary-light">
                          {row.schoolName}
                        </td>
                      ) : null}
                      {visibleColumns.examTerm ? <td>{row.examTerm}</td> : null}
                      {visibleColumns.receiverType ? (
                        <td>{row.receiverType}</td>
                      ) : null}
                      {visibleColumns.studentMark ? (
                        <td>{row.studentMark}</td>
                      ) : null}
                      {visibleColumns.subject ? <td>{row.subject}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Delete"
                            onClick={() => handleDelete(row)}
                          >
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
              Showing{" "}
              {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{" "}
              {Math.min(currentPage * rowsPerPage, totalElements)} of{" "}
              {totalElements}
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
              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  type="button"
                  className={
                    p === currentPage
                      ? "btn btn-sm btn-primary-600"
                      : "btn btn-sm btn-light border"
                  }
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Mark Send By Email"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form
          className="p-20 d-grid grid-cols-2 gap-16"
          onSubmit={handleApplyFilters}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="exam"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Exam
            </label>
            <select
              id="exam"
              className="form-control form-select"
              value={pendingFilters.exam}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Exam</option>
              {examOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="receiverType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Receiver Type
            </label>
            <select
              id="receiverType"
              className="form-control form-select"
              value={pendingFilters.receiverType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Receiver Type</option>
              {RECEIVER_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="studentMark"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Student Mark
            </label>
            <select
              id="studentMark"
              className="form-control form-select"
              value={pendingFilters.studentMark}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Student Mark</option>
              {studentMarkOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label
              htmlFor="subject"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Subject
            </label>
            <select
              id="subject"
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Subject</option>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default MarkSendByEmail;
