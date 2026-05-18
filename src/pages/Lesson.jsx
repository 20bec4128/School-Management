import { useCallback, useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import {
  createLesson,
  deleteLesson,
  fetchLessons,
} from "../apis/lessonsApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import "../assets/css/addModalShared.css";
import FindEmptyState from "../components/FindEmptyState";
import ExportDropdown from '../components/ExportDropdown'

const ACADEMIC_YEAR_OPTIONS = [
  "2025-2026",
  "2024-2025",
  "2023-2024",
  "2022-2023",
];

const emptyForm = {
  schoolId: "Select",
  academicYear: "Select",
  classId: "Select",
  subjectId: "Select",
  lesson: "",
  note: "",
};

const emptyFilters = {
  schoolId: "Select",
  academicYear: "Select",
  classId: "Select",
  subjectId: "Select",
};

const columnOptions = [
  { key: "schoolName", label: "School" },
  { key: "academicYear", label: "Academic Year" },
  { key: "className", label: "Class" },
  { key: "subjectName", label: "Subject" },
  { key: "lesson", label: "Lesson" },
  { key: "note", label: "Note" },
];

const FIELD_ICONS = {
  schoolId: "ri-school-line",
  academicYear: "ri-calendar-line",
  classId: "ri-building-line",
  subjectId: "ri-book-open-line",
  lesson: "ri-file-list-3-line",
  note: "ri-sticky-note-line",
};

// FormField Wrapper based on standard
const FormField = ({ label, id, required, children, full = false }) => (
  <div className={`col-12 ${full ? "" : "col-md-6"} mb-16`}>
    <label className="text-sm fw-semibold text-primary-light mb-8">
      {label} {required && <span className="text-danger-600">*</span>}
    </label>
    <div className="position-relative">
      {children}
      <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
        <i className={FIELD_ICONS[id] || "ri-edit-line"}></i>
      </span>
    </div>
  </div>
);

const Lesson = ({ onNavigate }) => {
  const {
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();
  const { activeSchoolId, isSchoolSelectionEnabled } = useSchool();

  const [data, setData] = useState([]); // Standardized to 'data'
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [hasSearched, setHasSearched] = useState(false);

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  const isTeacherScope = String(role || "").toUpperCase() === "TEACHER";
  const resolvedSchoolId = activeSchoolId
    ? String(activeSchoolId)
    : authSchoolId
      ? String(authSchoolId)
      : "";

  // --- LOOKUP LOADING ---
  useEffect(() => {
    const loadLookups = async () => {
      const [s, c, sub] = await Promise.all([
        fetchSchoolsLookup(),
        fetchClasses(),
        fetchSubjects(),
      ]);
      setSchoolsLookup(s);
      setClassesLookup(c);
      setSubjectsLookup(sub);
    };
    loadLookups();
  }, []);

  // --- FILTERING & PAGINATION ---
  const filtered = useMemo(() => {
    if (!hasSearched) return [];
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch =
        !q ||
        Object.values(row).some((v) => String(v).toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [data, search, hasSearched]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [currentPage, filtered, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    const headers = columnOptions
      .filter((c) => visibleColumns[c.key])
      .map((c) => c.label)
      .join(",");
    const rows = filtered
      .map((row) =>
        columnOptions
          .filter((c) => visibleColumns[c.key])
          .map((c) => row[c.key])
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lessons.csv";
    link.click();
  };

  // --- ACTIONS ---
  const handleApplyFilters = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const result = await fetchLessons({ ...pendingFilters });
      setData(result);
      setFilters(pendingFilters);
      setHasSearched(true);
      setIsFindSidebarOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (row) => {
    try {
      const schoolRow = schoolsLookup.find((school) => String(school.id) === String(row?.schoolId ?? ""))
      sessionStorage.setItem(
        "sm_edit_lesson",
        JSON.stringify({
          id: row?.id ?? null,
          headOfficeId: schoolRow?.headOfficeId ?? null,
          schoolId: row?.schoolId ?? null,
          schoolName: row?.schoolName ?? "",
          academicYear: row?.academicYear ?? "",
          classId: row?.classId ?? null,
          className: row?.className ?? "",
          subjectId: row?.subjectId ?? null,
          subjectName: row?.subjectName ?? "",
          lesson: row?.lesson ?? "",
          note: row?.note ?? "",
        }),
      );
      onNavigate?.("edit-lesson");
    } catch {
      // ignore storage failures and stay on the page
    }
  };

  useEffect(() => {
    void handleApplyFilters();
    // Load the table once on entry so newly saved lessons show up immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCell = (row, column) => {
    const value = row[column.key];
    if (column.key === "lesson")
      return <span className="fw-medium text-primary-light">{value}</span>;
    return value || "--";
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Lesson</h1>
          <span className="text-secondary-light">Dashboard / Lesson</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              {/* Export Dropdown */}
              <ExportDropdown onExportExcel={()=>{}} />

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
                  <i className="ri-arrow-down-s-line"></i>
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

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFindSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Filter</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-center gap-16">
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
              <button
                className="btn btn-primary-600 radius-8 px-20 py-11 d-flex align-items-center gap-2"
                onClick={() => onNavigate?.("add-lesson")}
              >
                <i className="ri-add-line"></i> Add Lesson
              </button>
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
                        <th scope="col" key={col.key}>
                          {col.label}
                        </th>
                      ),
                  )}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40"
                    >
                      <FindEmptyState
                        title="Lesson"
                        onFind={() => setIsFindSidebarOpen(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </label>
                        </div>
                      </td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>{renderCell(row, col)}</td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="text-primary-600 bg-primary-100 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)}>
                            <i className="ri-edit-line"></i>
                          </button>
                          <button type="button" className="text-danger-600 bg-danger-100 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle">
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

          {/* Pagination Footer */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing{" "}
              {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}{" "}
              – {Math.min(currentPage * rowsPerPage, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <button className="btn btn-sm btn-primary-600">
                {currentPage}
              </button>
              <button
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

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFindSidebarOpen}
        title="Find Lesson"
        onClose={() => setIsFindSidebarOpen(false)}
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">
              School
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={(e) =>
                setPendingFilters({
                  ...pendingFilters,
                  schoolId: e.target.value,
                })
              }
            >
              <option value="Select">All Schools</option>
              {schoolsLookup.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.schoolName}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary-600 w-100 mt-16">
            Apply Filters
          </button>
        </form>
      </SlideSidebar>

    </div>
  );
};

export default Lesson;
