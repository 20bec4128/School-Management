import { useCallback, useEffect, useMemo, useState } from "react";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import useColumnVisibility from "../hooks/useColumnVisibility";
import {
  deleteOpeningHour,
  fetchOpeningHoursPage,
  toggleOpeningHourStatus,
} from "../apis/openingHourApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import ExportDropdown from "../components/ExportDropdown";
import SlideSidebar from "../components/SlideSidebar";

const EDIT_STORAGE_KEY = "edit-opening-hour-row";

const columnOptions = [
  { key: "school", label: "School" },
  { key: "status", label: "Status" },
];

const OpeningHour = ({ onNavigate }) => {
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
  const PAGE_SLUG = 'opening-hour';
  const PAGE_PERMISSIONS = {
    add: canAdd(PAGE_SLUG),
    edit: canEdit(PAGE_SLUG),
    delete: canDelete(PAGE_SLUG),
  };

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
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [pendingSchoolId, setPendingSchoolId] = useState("");
  const [appliedSuperAdminSchoolId, setAppliedSuperAdminSchoolId] = useState("");

  const [schools, setSchools] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions, 1);

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
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? "") === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")));
    }

    return [...schools].sort((a, b) => String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")));
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, schools]);

  const loadScopeLookups = useCallback(async () => {
    if (status !== "ready") return;

    try {
      if (isSuperAdmin) {
        const [headOfficePage, schoolList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ]);
        setHeadOffices(Array.isArray(headOfficePage?.content) ? headOfficePage.content : []);
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
      // ignore
    }
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, status]);

  useEffect(() => {
    void loadScopeLookups();
  }, [loadScopeLookups]);

  useEffect(() => {
    if (isSuperAdmin) {
      setPendingSchoolId(appliedSuperAdminSchoolId || "");
      return;
    }

    setPendingSchoolId(activeSchoolId || "");
  }, [activeSchoolId, appliedSuperAdminSchoolId, isSuperAdmin]);

  const loadRows = useCallback(async () => {
    if (status !== "ready") return;

    if (isHeadOfficeAdmin && !activeSchoolId) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setBusy(false);
      return;
    }

    const effectiveSchoolId = isSchoolAdmin
      ? authSchoolId != null
        ? String(authSchoolId)
        : ""
      : isHeadOfficeAdmin
      ? activeSchoolId
        ? String(activeSchoolId)
        : ""
      : appliedSuperAdminSchoolId
      ? String(appliedSuperAdminSchoolId)
      : "";

    setBusy(true);
    setError("");

    try {
      const data = await fetchOpeningHoursPage({
        schoolId: effectiveSchoolId,
        page: currentPage - 1,
        size: rowsPerPage === -1 ? 999999 : rowsPerPage,
      });

      setRows(Array.isArray(data?.content) ? data.content : []);
      setTotalElements(data?.totalElements ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } catch (e) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setError(e?.message || "Failed to load opening hours");
    } finally {
      setBusy(false);
    }
  }, [
    activeSchoolId,
    appliedSuperAdminSchoolId,
    authSchoolId,
    currentPage,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    rowsPerPage,
    status,
  ]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleToggleStatus = async (id) => {
    if (!id) return;
    setSaving(true);
    setError("");

    try {
      await toggleOpeningHourStatus(id);
      await loadRows();
    } catch (e) {
      setError(e?.message || "Failed to toggle status");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;

    const ok = window.confirm("Delete this opening hour configuration? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError("");

    try {
      await deleteOpeningHour(id);
      await loadRows();
    } catch (e) {
      setError(e?.message || "Failed to delete opening hour");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY);
    } catch {
      // ignore
    }
    navigateTo("add-opening-hour");
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    if (isSuperAdmin) {
      setAppliedSuperAdminSchoolId(pendingSchoolId || "");
    } else {
      setActiveSchoolId(pendingSchoolId || null);
    }
    setCurrentPage(1);
    setIsFilterSidebarOpen(false);
  };

  const handleResetFilters = () => {
    setPendingSchoolId("");
    if (isSuperAdmin) {
      setAppliedSuperAdminSchoolId("");
    } else {
      setActiveSchoolId(null);
    }
    setCurrentPage(1);
  };

  const handleEdit = (row) => {
    if (!row) return;
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row));
    } catch {
      // ignore
    }
    navigateTo("add-opening-hour");
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
    isHeadOfficeAdmin && !activeSchoolId
      ? "Select a school to view opening hours."
      : busy
      ? "Loading opening hours..."
      : "No opening hours configured.";

  return (
    <div className="dashboard-main-body">
      {/* Header & Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Opening Hour
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / Opening Hour</span>
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex flex-wrap align-items-center gap-16">
          {PAGE_PERMISSIONS.add && (
            <button
              type="button"
              className="btn btn-primary-600 d-flex align-items-center gap-6 px-16 py-8 radius-8 text-sm"
              onClick={handleCreateNew}
            >
              <i className="ri-add-line text-lg"></i> Add Opening Hour
            </button>
          )}
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
          <span>Please choose a school to load and manage opening hours.</span>
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              {(isSuperAdmin || isHeadOfficeAdmin) && (
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
              )}

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

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "80px" }}>#SL</th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.status ? <th scope="col" style={{ width: "160px" }}>Status</th> : null}
                  <th scope="col" className="text-center" style={{ width: "140px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {busy || (isHeadOfficeAdmin && !activeSchoolId) ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      {busy && <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />}
                      <div>{emptyMessage}</div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No opening hours configured.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.schoolName || "-"}</td>
                      ) : null}
                      {visibleColumns.status ? (
                        <td>
                          <div className="form-check form-switch p-0 d-flex align-items-center">
                            <input
                              className="form-check-input ms-0 cursor-pointer"
                              type="checkbox"
                              role="switch"
                              checked={row.status}
                              onChange={() => handleToggleStatus(row.id)}
                              disabled={saving}
                              style={{ width: "40px", height: "20px" }}
                            />
                            <span className={`ms-8 text-sm fw-medium ${row.status ? "text-success-600" : "text-neutral-500"}`}>
                              {row.status ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center justify-content-center gap-12">
                          {PAGE_PERMISSIONS.edit && (
                            <button
                              type="button"
                              className="w-32-px h-32-px bg-success-50 text-success-600 rounded-circle d-flex align-items-center justify-content-center border-0"
                              onClick={() => handleEdit(row)}
                              disabled={saving}
                              title="Edit"
                            >
                              <i className="ri-pencil-line"></i>
                            </button>
                          )}
                          {PAGE_PERMISSIONS.delete && (
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
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    page === currentPage
                      ? "btn btn-sm btn-primary-600"
                      : "btn btn-sm btn-light border"
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={totalPages <= currentPage}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Opening Hour"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select
              className="form-control form-select"
              value={pendingSchoolId}
              onChange={(e) => setPendingSchoolId(e.target.value)}
            >
              <option value="">
                {isSuperAdmin ? "All Schools" : "Select School"}
              </option>
              {schoolPickerOptions.map((school) => (
                <option key={school.id} value={String(school.id)}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex align-items-center gap-12 justify-content-end pt-4">
            <button
              type="button"
              className="btn btn-outline-neutral-300 px-20 py-10 radius-8 text-sm"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary-600 px-20 py-10 radius-8 text-sm"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default OpeningHour;
