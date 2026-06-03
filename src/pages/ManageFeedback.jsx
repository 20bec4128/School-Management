import { useCallback, useEffect, useMemo, useState } from "react";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import useColumnVisibility from "../hooks/useColumnVisibility";
import {
  deleteFeedback,
  fetchFeedbacksPage,
  toggleFeedbackPublish,
} from "../apis/feedbackApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import ExportDropdown from "../components/ExportDropdown";

const columnOptions = [
  { key: "schoolName", label: "School" },
  { key: "feedback", label: "Feedback" },
  { key: "isPublish", label: "Is Publish?" },
  { key: "date", label: "Date" },
];

const ManageFeedback = ({ onNavigate }) => {
  const {
    status,
    role,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth();
  const PAGE_SLUG = "feedback";

  const { activeSchoolId, setActiveSchoolId } = useSchool();

  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const isHeadOfficeAdmin = String(role || "").toUpperCase() === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = String(role || "").toUpperCase() === "SCHOOL_ADMIN";

  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [schools, setSchools] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState({ schoolId: { value: "" } });
  const [filters, setFilters] = useState({ schoolId: { value: "" } });

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  useEffect(() => {
    if (!filterOpen) {
      setPendingFilters({ schoolId: { value: filters.schoolId?.value || "" } });
    }
  }, [filterOpen, filters.schoolId]);

  const currentSchoolOption = useMemo(() => {
    if (!authSchoolId) return null;
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    };
  }, [authHeadOfficeId, authSchoolId, authSchoolName]);

  const schoolPickerOptions = useMemo(() => {
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : [];
    }

    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : "";
      return schools
        .filter((school) => String(school?.headOfficeId ?? "") === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")));
    }

    return schools.sort((a, b) => String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")));
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, schools]);

  const resolvedHeadOfficeSchoolId = useMemo(() => {
    if (!isHeadOfficeAdmin) return "";

    const candidates = [filters.schoolId?.value, activeSchoolId]
      .map((value) => (value == null ? "" : String(value).trim()))
      .filter(Boolean);

    const validCandidate = candidates.find((candidate) =>
      schoolPickerOptions.some((school) => String(school.id) === candidate),
    );

    if (validCandidate) return validCandidate;
    return schoolPickerOptions.length > 0 ? String(schoolPickerOptions[0].id) : "";
  }, [activeSchoolId, filters.schoolId, isHeadOfficeAdmin, schoolPickerOptions]);

  const filterColumns = useMemo(
    () => [
      {
        field: "schoolId",
        header: "School",
        filterType: "dropdown",
        filterOptions: [
          { value: "", label: isSuperAdmin ? "All Schools" : "Select School" },
          ...schoolPickerOptions.map((school) => ({
            value: String(school.id),
            label: school.schoolName,
          })),
        ],
      },
    ],
    [isSuperAdmin, schoolPickerOptions],
  );

  const activeFilterTags = useMemo(() => {
    const schoolId = filters.schoolId?.value || "";
    if (!schoolId) return [];
    const school = schoolPickerOptions.find((item) => String(item.id) === String(schoolId))
    return school ? [{ field: "schoolId", label: "School", value: school.schoolName }] : []
  }, [filters.schoolId, schoolPickerOptions]);

  const loadScopeLookups = useCallback(async () => {
    if (status !== "ready") return;

    try {
      if (isSuperAdmin) {
        const [headOfficePage, schoolList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ]);
        setSchools(Array.isArray(schoolList) ? schoolList : []);
      } else if (isHeadOfficeAdmin) {
        const schoolList = await fetchSchoolsLookup();
        const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : "";
        const filteredSchools = (Array.isArray(schoolList) ? schoolList : []).filter(
          (school) => String(school?.headOfficeId ?? "") === targetHeadOfficeId
        );
        setSchools(filteredSchools);
      } else if (isSchoolAdmin) {
        setSchools(currentSchoolOption ? [currentSchoolOption] : []);
      }
    } catch {
      // ignore lookup failures
    }
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, status]);

  useEffect(() => {
    void loadScopeLookups();
  }, [loadScopeLookups]);

  useEffect(() => {
    if (status !== "ready" || !isHeadOfficeAdmin) return;
    if (schoolPickerOptions.length === 0) return;

    const fallbackSchoolId = String(schoolPickerOptions[0].id);
    const selectedSchoolId = String(filters.schoolId?.value || activeSchoolId || "").trim();
    const selectedIsValid = schoolPickerOptions.some(
      (school) => String(school.id) === selectedSchoolId,
    );

    const nextSchoolId = selectedIsValid ? selectedSchoolId : fallbackSchoolId;

    if (nextSchoolId && activeSchoolId !== nextSchoolId) {
      setActiveSchoolId(nextSchoolId);
    }

    if (String(filters.schoolId?.value || "") !== nextSchoolId) {
      setFilters((prev) => ({ ...prev, schoolId: { value: nextSchoolId } }));
    }

    if (String(pendingFilters.schoolId?.value || "") !== nextSchoolId) {
      setPendingFilters((prev) => ({ ...prev, schoolId: { value: nextSchoolId } }));
    }
  }, [
    activeSchoolId,
    filters.schoolId,
    isHeadOfficeAdmin,
    pendingFilters.schoolId,
    schoolPickerOptions,
    setActiveSchoolId,
    status,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadRows = useCallback(async () => {
    if (status !== "ready") return;

    const effectiveSchoolId = isSchoolAdmin
      ? authSchoolId != null
        ? String(authSchoolId)
        : ""
      : isHeadOfficeAdmin
      ? resolvedHeadOfficeSchoolId
      : filters.schoolId?.value || "";

    if (isHeadOfficeAdmin && !effectiveSchoolId) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setBusy(false);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const data = await fetchFeedbacksPage({
        schoolId: effectiveSchoolId,
        page: currentPage - 1,
        size: rowsPerPage === -1 ? 999999 : rowsPerPage,
        search: debouncedSearch,
      });

      setRows(Array.isArray(data?.content) ? data.content : []);
      setTotalElements(data?.totalElements ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } catch (e) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setError(e?.message || "Failed to load feedbacks");
    } finally {
      setBusy(false);
    }
  }, [authSchoolId, currentPage, debouncedSearch, isHeadOfficeAdmin, isSchoolAdmin, resolvedHeadOfficeSchoolId, rowsPerPage, status, filters.schoolId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleTogglePublish = async (id) => {
    if (!id) return;
    setSaving(true);
    setError("");

    try {
      await toggleFeedbackPublish(id);
      await loadRows();
    } catch (e) {
      setError(e?.message || "Failed to toggle feedback status");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;

    const ok = window.confirm("Delete this feedback? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError("");

    try {
      await deleteFeedback(id);
      await loadRows();
    } catch (e) {
      setError(e?.message || "Failed to delete feedback");
    } finally {
      setSaving(false);
    }
  };

  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages || 1, start + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  const emptyMessage =
    isHeadOfficeAdmin && !filters.schoolId?.value
      ? "Select a school to view feedback."
      : busy
      ? "Loading feedback..."
      : "No feedback found.";

  const activeFilterCount = activeFilterTags.length;

  const handlePendingFilterChange = (field, value) => {
    setPendingFilters((prev) => ({ ...prev, [field]: { value } }));
  };

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setActiveSchoolId(pendingFilters.schoolId?.value || null);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setPendingFilters({ schoolId: { value: "" } });
    setFilters({ schoolId: { value: "" } });
    setActiveSchoolId(null);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  return (
    <div className="dashboard-main-body">
      {/* Header & Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Manage Feedback
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / Manage Feedback</span>
          </div>
        </div>

      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-20">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      )}

      {isHeadOfficeAdmin && !activeSchoolId && (
        <div className="alert alert-info d-flex align-items-center gap-8 mb-16">
          <i className="ri-information-line"></i>
          <span>Please choose a school to load and manage feedback.</span>
        </div>
      )}

      {/* Grid Table Container */}
      <div className="card h-100 border border-neutral-200">
        <div className="card-body p-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-6 border border-neutral-300 radius-8 d-flex align-items-center gap-10 bg-white text-secondary-light text-sm"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span>Columns</span>
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

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value);
                  setCurrentPage(1);
                }}
              />

              {(isSuperAdmin || isHeadOfficeAdmin) && (
                <button
                  type="button"
                  className="px-12 py-6 border border-neutral-300 radius-8 d-flex align-items-center gap-8 bg-white text-secondary-light text-sm"
                  onClick={() => setFilterOpen((prev) => !prev)}
                >
                  <i className="ri-filter-3-line"></i>
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="badge bg-primary-600 rounded-pill">{activeFilterCount}</span>
                  )}
                </button>
              )}
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search feedback..."
                style={{ width: "260px" }}
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

          {filterOpen && (isSuperAdmin || isHeadOfficeAdmin) && (
            <div className="px-20 py-16 border-bottom border-neutral-200 bg-neutral-50">
              <div className="row g-16 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-medium text-primary-light mb-8">School</label>
                  <select
                    className="form-select border border-neutral-300 radius-8 text-secondary-light"
                    value={pendingFilters.schoolId?.value || ""}
                    onChange={(e) => handlePendingFilterChange("schoolId", e.target.value)}
                  >
                    <option value="">{isSuperAdmin ? "All Schools" : "Select School"}</option>
                    {schoolPickerOptions.map((school) => (
                      <option key={school.id} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-8">
                  <div className="d-flex justify-content-end gap-8">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-20 py-8 radius-8"
                      onClick={handleResetFilters}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary-600 px-20 py-8 radius-8"
                      onClick={handleApplyFilters}
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "80px" }}>#SL</th>
                  {visibleColumns.schoolName && <th scope="col">School</th>}
                  {visibleColumns.feedback && <th scope="col">Feedback</th>}
                  {visibleColumns.isPublish && <th scope="col" style={{ width: "130px" }}>Is Publish?</th>}
                  {visibleColumns.date && <th scope="col" style={{ width: "120px" }}>Date</th>}
                  <th scope="col" className="text-center" style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {busy || (isHeadOfficeAdmin && !filters.schoolId?.value) ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {busy && <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />}
                      <div>{emptyMessage}</div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No feedback found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      {visibleColumns.schoolName && (
                        <td className="fw-medium text-primary-light">{row.schoolName || "-"}</td>
                      )}
                      {visibleColumns.feedback && (
                        <td style={{ whiteSpace: "pre-wrap" }}>{row.feedback || "-"}</td>
                      )}
                      {visibleColumns.isPublish && (
                        <td>
                          <div className="form-check form-switch p-0 d-flex align-items-center">
                            <input
                              className="form-check-input ms-0 cursor-pointer"
                              type="checkbox"
                              role="switch"
                              checked={row.isPublish}
                              onChange={() => handleTogglePublish(row.id)}
                              disabled={saving || !canEdit(PAGE_SLUG)}
                              style={{ width: "40px", height: "20px" }}
                            />
                            <span className={`ms-8 text-sm fw-medium ${row.isPublish ? "text-success-600" : "text-neutral-500"}`}>
                              {row.isPublish ? "Published" : "Draft"}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.date && <td>{row.date || "-"}</td>}
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="w-32-px h-32-px bg-danger-50 text-danger-600 rounded-circle d-flex align-items-center justify-content-center border-0"
                              onClick={() => handleDelete(row.id)}
                              disabled={saving}
                              title="Delete"
                            >
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

          {/* Pagination Footer */}
          {!busy && totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-12 px-20 py-16 border-top border-neutral-200">
              <span className="text-secondary-light text-sm">
                Showing {rows.length} of {totalElements} entries
              </span>
              <ul className="pagination d-flex align-items-center gap-8 mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link w-32-px h-32-px rounded-circle d-flex align-items-center justify-content-center p-0 border border-neutral-300"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>
                </li>
                {getVisiblePages().map((page) => (
                  <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                    <button
                      type="button"
                      className={`page-link w-32-px h-32-px rounded-circle d-flex align-items-center justify-content-center p-0 border ${
                        currentPage === page
                          ? "bg-primary-600 border-primary-600 text-white"
                          : "border-neutral-300 text-secondary-light"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link w-32-px h-32-px rounded-circle d-flex align-items-center justify-content-center p-0 border border-neutral-300"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageFeedback;
