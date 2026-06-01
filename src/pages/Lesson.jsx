import { useCallback, useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import {
  createLesson,
  deleteLesson,
  fetchLessons,
} from "../apis/lessonsApi";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchAcademicYears } from "../apis/academicYearsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import { TablePagination } from "../components/table";
import "../assets/css/addModalShared.css";
import FindEmptyState from "../components/FindEmptyState";
import ExportDropdown from '../components/ExportDropdown'

const LESSON_LIST_SCOPE_KEY = "sm_lesson_list_scope";

const emptyForm = {
  schoolId: "Select",
  academicYear: "Select",
  classId: "Select",
  subjectId: "Select",
  lesson: "",
  note: "",
};

const emptyFilters = {
  headOfficeId: "Select",
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
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth();
  const PAGE_SLUG = 'lesson';
  const { activeSchoolId, isSchoolSelectionEnabled } = useSchool();

  const [data, setData] = useState([]); // Standardized to 'data'
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [headOfficesLookup, setHeadOfficesLookup] = useState([]);
  const [academicYearsLookup, setAcademicYearsLookup] = useState([]);
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

  const exportColumns = useMemo(
    () => [
      { key: "schoolName", label: "School" },
      { key: "academicYear", label: "Academic Year" },
      { key: "className", label: "Class" },
      { key: "subjectName", label: "Subject" },
      { key: "lesson", label: "Lesson" },
      { key: "note", label: "Note" },
    ],
    [],
  );

  const exportVisibleColumns = useMemo(
    () => ({
      schoolName: visibleColumns.schoolName ?? visibleColumns.school,
      academicYear: visibleColumns.academicYear,
      className: visibleColumns.className,
      subjectName: visibleColumns.subjectName,
      lesson: visibleColumns.lesson,
      note: visibleColumns.note,
    }),
    [visibleColumns],
  );

  const roleUpper = String(role || "").toUpperCase();
  const isSuperAdmin = roleUpper === "SUPER_ADMIN";
  const isHeadOfficeAdmin = roleUpper === "HEAD_OFFICE_ADMIN";
  const isTeacherScope = String(role || "").toUpperCase() === "TEACHER";
  const resolvedSchoolId = activeSchoolId
    ? String(activeSchoolId)
    : authSchoolId
      ? String(authSchoolId)
      : "";
  const headOfficeOptions = useMemo(() => {
    const list = (Array.isArray(headOfficesLookup) ? headOfficesLookup : [])
      .map((row) => ({
        id: row?.id,
        name: row?.name || row?.headOfficeName || "",
      }))
      .filter((row) => row.id != null && row.name);
    if (isHeadOfficeAdmin && authHeadOfficeId != null && authHeadOfficeName) {
      const exists = list.some((row) => String(row.id) === String(authHeadOfficeId));
      if (!exists) list.unshift({ id: authHeadOfficeId, name: authHeadOfficeName });
    }
    return list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [authHeadOfficeId, authHeadOfficeName, headOfficesLookup, isHeadOfficeAdmin]);

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schoolsLookup) ? schoolsLookup.slice() : [];
    const selectedHeadOfficeId = pendingFilters.headOfficeId !== "Select"
      ? String(pendingFilters.headOfficeId)
      : isHeadOfficeAdmin && authHeadOfficeId != null
        ? String(authHeadOfficeId)
        : "";
    const filtered = selectedHeadOfficeId
      ? list.filter((s) => String(s?.headOfficeId ?? "") === selectedHeadOfficeId)
      : isHeadOfficeAdmin && authHeadOfficeId != null
        ? list.filter((s) => String(s?.headOfficeId ?? "") === String(authHeadOfficeId))
        : resolvedSchoolId
          ? list.filter((s) => String(s?.id ?? "") === String(resolvedSchoolId))
        : list;
    return filtered
      .map((row) => ({ id: row?.id, schoolName: row?.schoolName || row?.name || "" }))
      .filter((row) => row.id != null && row.schoolName)
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)));
  }, [authHeadOfficeId, isHeadOfficeAdmin, pendingFilters.headOfficeId, resolvedSchoolId, schoolsLookup]);

  const selectedSchoolIdForLookups = useMemo(() => {
    if (pendingFilters.schoolId && pendingFilters.schoolId !== "Select") {
      return pendingFilters.schoolId;
    }
    if (!isSuperAdmin && resolvedSchoolId) {
      return resolvedSchoolId;
    }
    return "";
  }, [isSuperAdmin, pendingFilters.schoolId, resolvedSchoolId]);

  const initialSchoolId = useMemo(() => {
    if (activeSchoolId) return String(activeSchoolId);
    if (authSchoolId) return String(authSchoolId);
    return "";
  }, [activeSchoolId, authSchoolId]);

  const savedScopeSchoolId = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(LESSON_LIST_SCOPE_KEY);
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed?.schoolId ? String(parsed.schoolId) : "";
    } catch {
      return "";
    }
  }, []);

  // --- LOOKUP LOADING ---
  useEffect(() => {
    const loadLookups = async () => {
      const [ho, s] = await Promise.allSettled([
        isSuperAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
        fetchSchoolsLookup(),
      ]);
      setHeadOfficesLookup(ho.status === "fulfilled" ? (Array.isArray(ho.value?.content) ? ho.value.content : []) : []);
      setSchoolsLookup(s.status === "fulfilled" ? s.value : []);
    };
    loadLookups();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!selectedSchoolIdForLookups) {
      setAcademicYearsLookup([]);
      setClassesLookup([]);
      setSubjectsLookup([]);
      return;
    }

    let cancelled = false;
    const loadSchoolLookups = async () => {
      try {
        const [years, classes, subjects] = await Promise.all([
          fetchAcademicYears({ schoolId: selectedSchoolIdForLookups }),
          fetchClasses({ schoolId: selectedSchoolIdForLookups }),
          fetchSubjects({ schoolId: selectedSchoolIdForLookups }),
        ]);
        if (cancelled) return;
        setAcademicYearsLookup(Array.isArray(years) ? years : []);
        setClassesLookup(Array.isArray(classes) ? classes : []);
        setSubjectsLookup(Array.isArray(subjects) ? subjects : []);
      } catch {
        if (cancelled) return;
        setAcademicYearsLookup([]);
        setClassesLookup([]);
        setSubjectsLookup([]);
      }
    };

    void loadSchoolLookups();

    return () => {
      cancelled = true;
    };
  }, [selectedSchoolIdForLookups]);

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
  const handleApplyFilters = async (e, options = {}) => {
    if (e) e.preventDefault();
    const { silent = false } = options;
    if (pendingFilters.schoolId === "Select") {
      if (silent) {
        setData([]);
        setFilters(pendingFilters);
        setHasSearched(false);
        return;
      }
      window.alert("Please select a school.");
      return;
    }
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

  const handleScopeChange = (field, value) => {
    setPendingFilters((prev) => {
      if (field === "headOfficeId") {
        return {
          ...prev,
          headOfficeId: value || "Select",
          schoolId: "Select",
          academicYear: "Select",
          classId: "Select",
          subjectId: "Select",
        };
      }
      if (field === "schoolId") {
        return {
          ...prev,
          schoolId: value || "Select",
          academicYear: "Select",
          classId: "Select",
          subjectId: "Select",
        };
      }
      return prev;
    });
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
    const scopeSchoolId = savedScopeSchoolId || initialSchoolId;

    if (!scopeSchoolId) {
      return;
    }

    const nextFilters = {
      ...emptyFilters,
      schoolId: scopeSchoolId,
    };

    setPendingFilters(nextFilters);
    setFilters(nextFilters);
    setHasSearched(true);
    setLoading(true);

    fetchLessons(nextFilters)
      .then((result) => setData(result))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
    try {
      sessionStorage.removeItem(LESSON_LIST_SCOPE_KEY);
    } catch {
      // ignore
    }
    // Load the table once on entry so newly saved lessons show up immediately.
  }, [initialSchoolId, savedScopeSchoolId]);

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
        {canAdd(PAGE_SLUG) && (
          <button
            className="btn btn-primary-600 radius-8 px-20 py-11 d-flex align-items-center gap-2"
            onClick={() => onNavigate?.("add-lesson")}
          >
            <i className="ri-add-line"></i> Add Lesson
          </button>
        )}
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={filtered}
                columns={exportColumns}
                visibleColumns={exportVisibleColumns}
                fileName="Lesson"
                pdfTitle="Lesson Report"
              />

              <div className="dropdown">
                <button
                  type="button"
                  className={`px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white${hasSearched ? " btn-tbl-active" : ""}`}
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
                  className={`px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white${visibleColumnCount < columnOptions.length ? " btn-tbl-active" : ""}`}
                onClick={() => setIsFindSidebarOpen(true)}
              >
                <span className="text-secondary-light text-sm">Filter</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(v)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
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
                        description="Use the Find button to select School, Academic Year, Class and Subject to load lessons."
                        buttonLabel="Find Lessons"
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
                          {canEdit(PAGE_SLUG) && (
                            <button type="button" className="text-primary-600 bg-primary-100 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" onClick={() => openEdit(row)}>
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button type="button" className="text-danger-600 bg-danger-100 w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle">
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                totalRecords: filtered.length,
                rowsPerPage,
                pageInfo: `Showing ${filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filtered.length)} of ${filtered.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
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
          {isSuperAdmin || isHeadOfficeAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={headOfficeOptions}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={
                isHeadOfficeAdmin && authHeadOfficeId != null
                  ? String(authHeadOfficeId)
                  : pendingFilters.headOfficeId === "Select"
                    ? ""
                    : pendingFilters.headOfficeId
              }
              onHeadOfficeChange={(value) => handleScopeChange("headOfficeId", value)}
              selectedSchoolId={pendingFilters.schoolId === "Select" ? "" : pendingFilters.schoolId}
              onSchoolChange={(value) => handleScopeChange("schoolId", value)}
              showHeadOfficeSelector={isSuperAdmin}
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">
                School
              </label>
              <select
                className="form-control form-select"
                value={pendingFilters.schoolId}
                onChange={(e) => handleScopeChange("schoolId", e.target.value)}
              >
                <option value="Select">All Schools</option>
                {schoolOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">
              Academic Year<span className="text-danger-600">*</span>
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.academicYear}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, academicYear: e.target.value }))}
              disabled={!selectedSchoolIdForLookups}
            >
              <option value="Select">--Select--</option>
              {academicYearsLookup.map((year) => (
                <option key={year.id} value={year.academicYear}>
                  {year.academicYear}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">
              Class<span className="text-danger-600">*</span>
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.classId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, classId: e.target.value }))}
              disabled={!selectedSchoolIdForLookups}
            >
              <option value="Select">--Select--</option>
              {classesLookup.map((cls) => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.className || cls.name || `Class ${cls.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">
              Subject<span className="text-danger-600">*</span>
            </label>
            <select
              className="form-control form-select"
              value={pendingFilters.subjectId}
              onChange={(e) => setPendingFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
              disabled={!selectedSchoolIdForLookups}
            >
              <option value="Select">--Select--</option>
              {subjectsLookup.map((subject) => (
                <option key={subject.id} value={String(subject.id)}>
                  {subject.name || subject.subjectName || `Subject ${subject.id}`}
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
