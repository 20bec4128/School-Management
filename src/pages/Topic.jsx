import { useCallback, useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import { deleteTopic, fetchTopics } from "../apis/topicsApi";
import { fetchLessons } from "../apis/lessonsApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import ExportDropdown from "../components/ExportDropdown";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import { TablePagination } from "../components/table";
import "../assets/css/addModalShared.css";
import FindEmptyState from "../components/FindEmptyState";

const EDIT_STORAGE_KEY = "edit-topic-row";
const ACADEMIC_YEAR_OPTIONS = [
  "2025-2026",
  "2024-2025",
  "2023-2024",
  "2022-2023",
];

const emptyFilters = {
  schoolId: "Select",
  academicYear: "Select",
  classId: "Select",
  subjectId: "Select",
  lessonId: "Select",
};

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  "Academic Year": "ri-calendar-line",
  Class: "ri-building-line",
  Subject: "ri-book-open-line",
  Lesson: "ri-file-list-3-line",
  Topic: "ri-bookmark-3-line",
  Note: "ri-sticky-note-line",
};

const columnOptions = [
  { key: "school", label: "School" },
  { key: "academicYear", label: "Academic Year" },
  { key: "className", label: "Class" },
  { key: "subjectName", label: "Subject" },
  { key: "lesson", label: "Lesson" },
  { key: "topic", label: "Topic" },
  { key: "note", label: "Note" },
];

const FormField = ({
  label,
  required,
  children,
  full = false,
  noIcon = false,
}) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {!noIcon ? (
        <div className="avm-input-with-icon" style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#667085",
              fontSize: "0.95rem",
              lineHeight: 1,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <i className={icon}></i>
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

const Topic = ({ onNavigate }) => {
  const {
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    role,
  } = useAuth();
  const { activeSchoolId, isSchoolSelectionEnabled } = useSchool();
  const [topics, setTopics] = useState([]);
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);
  const [lessonsLookup, setLessonsLookup] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [findErrors, setFindErrors] = useState({});
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
      { key: "topic", label: "Topic" },
      { key: "note", label: "Note" },
    ],
    [],
  );

  const exportVisibleColumns = useMemo(
    () => ({
      schoolName: visibleColumns.school,
      academicYear: visibleColumns.academicYear,
      className: visibleColumns.className,
      subjectName: visibleColumns.subjectName,
      lesson: visibleColumns.lesson,
      topic: visibleColumns.topic,
      note: visibleColumns.note,
    }),
    [visibleColumns],
  );

  const resolvedSchoolId = activeSchoolId
    ? String(activeSchoolId)
    : authSchoolId
      ? String(authSchoolId)
      : "";
  const resolvedSchoolName = authSchoolName || "";
  const canAddTopics = role !== "STUDENT" && role !== "PARENT";

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const [schoolsResult, classesResult, subjectsResult] =
          await Promise.allSettled([
            fetchSchoolsLookup(),
            fetchClasses(),
            fetchSubjects(),
          ]);
        if (ignore) return;
        const schools =
          schoolsResult.status === "fulfilled" ? schoolsResult.value : [];
        const classes =
          classesResult.status === "fulfilled" ? classesResult.value : [];
        const subjects =
          subjectsResult.status === "fulfilled" ? subjectsResult.value : [];
        setSchoolsLookup(Array.isArray(schools) ? schools : []);
        setClassesLookup(Array.isArray(classes) ? classes : []);
        setSubjectsLookup(Array.isArray(subjects) ? subjects : []);
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load lookups");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, []);

  const loadLessonsLookup = useCallback(async (base) => {
    if (
      !base ||
      base.schoolId === "Select" ||
      base.academicYear === "Select" ||
      base.classId === "Select" ||
      base.subjectId === "Select"
    ) {
      setLessonsLookup([]);
      return;
    }
    const data = await fetchLessons({
      schoolId: base.schoolId,
      academicYear: base.academicYear,
      classId: base.classId,
      subjectId: base.subjectId,
    });
    const rows = Array.isArray(data) ? data : [];
    setLessonsLookup(
      rows
        .map((l) => ({ id: l?.id, name: l?.lesson }))
        .filter((l) => l.id != null && l.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        await loadLessonsLookup({
          schoolId: pendingFilters.schoolId,
          academicYear: pendingFilters.academicYear,
          classId: pendingFilters.classId,
          subjectId: pendingFilters.subjectId,
        });
      } catch {
        if (!ignore) setLessonsLookup([]);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [
    pendingFilters.schoolId,
    pendingFilters.academicYear,
    pendingFilters.classId,
    pendingFilters.subjectId,
    loadLessonsLookup,
  ]);

  const classOptions = useMemo(() => {
    return classesLookup
      .filter(
        (c) =>
          pendingFilters.schoolId === "Select" ||
          String(c.schoolId) === String(pendingFilters.schoolId),
      )
      .slice()
      .sort((a, b) =>
        String(a.className || "").localeCompare(String(b.className || "")),
      );
  }, [classesLookup, pendingFilters.schoolId]);

  const subjectOptions = useMemo(() => {
    return subjectsLookup
      .filter((s) => {
        if (
          pendingFilters.schoolId !== "Select" &&
          String(s.schoolId) !== String(pendingFilters.schoolId)
        )
          return false;
        if (
          pendingFilters.classId !== "Select" &&
          String(s.classId) !== String(pendingFilters.classId)
        )
          return false;
        return true;
      })
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [subjectsLookup, pendingFilters.schoolId, pendingFilters.classId]);

  const validateFind = () => {
    const errs = {};
    if (pendingFilters.schoolId === "Select") errs.schoolId = "School is required.";
    if (pendingFilters.academicYear === "Select")
      errs.academicYear = "Academic Year is required.";
    if (pendingFilters.classId === "Select") errs.classId = "Class is required.";
    if (pendingFilters.subjectId === "Select") errs.subjectId = "Subject is required.";
    return errs;
  };

  const loadTopics = useCallback(async (nextFilters) => {
    const data = await fetchTopics({
      schoolId: nextFilters.schoolId,
      academicYear: nextFilters.academicYear,
      classId: nextFilters.classId,
      subjectId: nextFilters.subjectId,
      lessonId:
        nextFilters.lessonId === "Select" ? undefined : nextFilters.lessonId,
    });
    setTopics(Array.isArray(data) ? data : []);
  }, []);

  const handleApplyFilters = async (e) => {
    if (e) e.preventDefault();
    const errs = validateFind();
    if (Object.keys(errs).length > 0) {
      setFindErrors(errs);
      return;
    }
    try {
      setFindErrors({});
      setError("");
      setLoading(true);
      await loadTopics(pendingFilters);
      setFilters(pendingFilters);
      setHasSearched(true);
      setIsFindSidebarOpen(false);
      setCurrentPage(1);
      setSelectedRows([]);
    } catch (e2) {
      setTopics([]);
      setError(e2?.message || "Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters);
    setFilters(emptyFilters);
    setFindErrors({});
    setHasSearched(false);
    setTopics([]);
    setSearch("");
    setCurrentPage(1);
    setSelectedRows([]);
  };

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target;
    setPendingFilters((prev) => {
      if (id === "schoolId")
        return {
          ...prev,
          schoolId: value,
          classId: "Select",
          subjectId: "Select",
          lessonId: "Select",
        };
      if (id === "classId")
        return { ...prev, classId: value, subjectId: "Select", lessonId: "Select" };
      if (id === "subjectId") return { ...prev, subjectId: value, lessonId: "Select" };
      return { ...prev, [id]: value };
    });
    setFindErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const filtered = useMemo(() => {
    if (!hasSearched) return [];
    const q = search.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((r) =>
      [
        r?.schoolName,
        r?.academicYear,
        r?.className,
        r?.subjectName,
        r?.lesson,
        r?.topic,
        r?.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [topics, search, hasSearched]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [currentPage, filtered, rowsPerPage]);

  const allSelected =
    paginated.length > 0 && paginated.every((r) => selectedRows.includes(r.id));

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedRows((prev) => [
        ...new Set([...prev, ...paginated.map((r) => r.id)]),
      ]);
    else
      setSelectedRows((prev) =>
        prev.filter((id) => !paginated.some((r) => r.id === id)),
      );
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const openAdd = () => {
    sessionStorage.removeItem(EDIT_STORAGE_KEY);
    onNavigate?.("add-topic");
  };

  const openEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row));
    onNavigate?.("add-topic");
  };

  const handleDelete = async (row) => {
    const id = row?.id;
    if (!id) return;
    if (!window.confirm(`Delete topic "${row?.topic || id}"?`)) return;
    try {
      setSaving(true);
      setError("");
      await deleteTopic(id);
      await loadTopics(filters);
    } catch (e) {
      setError(e?.message || "Failed to delete topic");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Topic</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Topic</span>
          </div>
        </div>
        {canAddTopics && (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <i className="ri-add-large-line text-md"></i> Add Topic
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={filtered}
                columns={exportColumns}
                visibleColumns={exportVisibleColumns}
                fileName="Topic"
                pdfTitle="Topic Report"
              />

              <button
                type="button"
                className={`px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white${hasSearched ? " btn-tbl-active" : ""}`}
                onClick={() => setIsFindSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Find</span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className={`px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white${visibleColumnCount < columnOptions.length ? " btn-tbl-active" : ""}`}
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
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
                        <span>{col.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(v) => {
                  setRowsPerPage(v)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>

            <div className="position-relative">
              <input
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search topic..."
                value={search}
                disabled={!hasSearched}
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
                  <th style={{ width: 80 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={hasSearched && allSelected}
                        onChange={handleSelectAll}
                        disabled={!hasSearched || loading}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school && <th>School</th>}
                  {visibleColumns.academicYear && <th>Academic Year</th>}
                  {visibleColumns.className && <th>Class</th>}
                  {visibleColumns.subjectName && <th>Subject</th>}
                  {visibleColumns.lesson && <th>Lesson</th>}
                  {visibleColumns.topic && <th>Topic</th>}
                  {visibleColumns.note && <th>Note</th>}
                  <th style={{ width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-24 text-secondary-light"
                    >
                      <FindEmptyState
                        title="Topic"
                        description="Use the Find button to select School, Academic Year, Class and Subject to load topics."
                        buttonLabel="Find Topics"
                        onFind={() => setIsFindSidebarOpen(true)}
                      />
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-24 text-secondary-light"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-24 text-secondary-light"
                    >
                      No topics found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r, idx) => (
                    <tr key={r.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(r.id)}
                            onChange={() => handleSelectRow(r.id)}
                          />
                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.school && <td>{r.schoolName}</td>}
                      {visibleColumns.academicYear && <td>{r.academicYear}</td>}
                      {visibleColumns.className && <td>{r.className}</td>}
                      {visibleColumns.subjectName && <td>{r.subjectName}</td>}
                      {visibleColumns.lesson && <td>{r.lesson}</td>}
                      {visibleColumns.topic && (
                        <td className="fw-medium text-primary-light">
                          {r.topic}
                        </td>
                      )}
                      {visibleColumns.note && <td>{r.note}</td>}
                      <td>
                        <div className="d-flex align-items-center gap-8">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => openEdit(r)}
                            title="Edit"
                            disabled={saving}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleDelete(r)}
                            title="Delete"
                            disabled={saving}
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

      <SlideSidebar
        isOpen={isFindSidebarOpen}
        title="Find Topic"
        onClose={() => setIsFindSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 avm-grid" onSubmit={handleApplyFilters}>
          <FormField label="School Name" required full>
            <select
              id="schoolId"
              className={`form-control form-select ps-44${findErrors.schoolId ? " is-invalid" : ""}`}
              value={pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolsLookup.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.schoolName}
                </option>
              ))}
            </select>
            {findErrors.schoolId && (
              <div className="text-danger-600 text-sm mt-4">
                {findErrors.schoolId}
              </div>
            )}
          </FormField>

          <FormField label="Academic Year" required full>
            <select
              id="academicYear"
              className={`form-control form-select ps-44${findErrors.academicYear ? " is-invalid" : ""}`}
              value={pendingFilters.academicYear}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {ACADEMIC_YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {findErrors.academicYear && (
              <div className="text-danger-600 text-sm mt-4">
                {findErrors.academicYear}
              </div>
            )}
          </FormField>

          <FormField label="Class" required>
            <select
              id="classId"
              className={`form-control form-select ps-44${findErrors.classId ? " is-invalid" : ""}`}
              value={pendingFilters.classId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {classOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.className}
                </option>
              ))}
            </select>
            {findErrors.classId && (
              <div className="text-danger-600 text-sm mt-4">
                {findErrors.classId}
              </div>
            )}
          </FormField>

          <FormField label="Subject" required>
            <select
              id="subjectId"
              className={`form-control form-select ps-44${findErrors.subjectId ? " is-invalid" : ""}`}
              value={pendingFilters.subjectId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select--</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            {findErrors.subjectId && (
              <div className="text-danger-600 text-sm mt-4">
                {findErrors.subjectId}
              </div>
            )}
          </FormField>

          <FormField label="Lesson">
            <select
              id="lessonId"
              className="form-control form-select ps-44"
              value={pendingFilters.lessonId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--All Lessons--</option>
              {lessonsLookup.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="col-12 d-flex gap-10 justify-content-end pt-8">
            <button
              type="button"
              className="btn btn-light border"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary-600"
              disabled={loading}
            >
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default Topic;
