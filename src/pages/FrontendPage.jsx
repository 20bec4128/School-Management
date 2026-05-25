import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import SlideSidebar from "../components/SlideSidebar";
import ExportDropdown from "../components/ExportDropdown";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import useColumnVisibility from "../hooks/useColumnVisibility";
import { TablePagination } from "../components/table";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchFrontendPagesPage, fetchFrontendPages, deleteFrontendPage } from "../apis/frontendPagesApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import { uniqueBy } from "../utils/schoolScope";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "frontend-page-edit-row";

const emptyFilters = {
  headOfficeId: "",
  schoolId: "Select",
};

const columnOptions = [
  { key: "school", label: "School" },
  { key: "location", label: "Location" },
  { key: "title", label: "Title" },
  { key: "urlSlug", label: "Slug" },
  { key: "image", label: "Image" },
];

const FrontendPage = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth();
  const PAGE_SLUG = "frontend-page";
  const normalizedRole = normalizeRole(role);
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
  const isHeadOfficeAdmin = normalizedRole === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = normalizedRole === "SCHOOL_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

  const [allSchools, setAllSchools] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await fetchSchoolsLookup();
        if (!cancelled) setAllSchools(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setAllSchools([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedHeadOfficeId = useMemo(() => {
    if (filters.headOfficeId && filters.headOfficeId !== "Select") return String(filters.headOfficeId);
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : "";
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : "";
    if (isSchoolAdmin) {
      const school = allSchools.find((item) => String(item.id) === String(authSchoolId ?? ""));
      return school?.headOfficeId != null ? String(school.headOfficeId) : "";
    }
    return "";
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId]);

  const selectedSchoolId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== "Select") return String(filters.schoolId);
    if (isSuperAdmin) return manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : "";
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : "";
    return "";
  }, [authSchoolId, filters.schoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId]);

  const schoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : [];
    if (isSuperAdmin && selectedHeadOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? "") === String(selectedHeadOfficeId));
    }
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : rowsList;
    if (isHeadOfficeAdmin) return rowsList.filter((school) => String(school?.headOfficeId ?? "") === String(authHeadOfficeId ?? ""));
    if (isSchoolAdmin) return rowsList.filter((school) => String(school?.id ?? "") === String(authSchoolId ?? ""));
    return rowsList;
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, selectedHeadOfficeId]);

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchFrontendPagesPage({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        search: search.trim() || undefined,
        page: currentPage - 1,
        size: rowsPerPage,
      });
      setRows(Array.isArray(result?.content) ? result.content : []);
      setTotalElements(Number(result?.totalElements ?? 0));
      setTotalPages(Number(result?.totalPages ?? 1) || 1);
    } catch (err) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(1);
      setError(err?.message || "Failed to load frontend pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedHeadOfficeId, selectedSchoolId, rowsPerPage, search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const allRows = await fetchFrontendPages({
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
      });
      const q = search.trim().toLowerCase();
      const filtered = allRows.filter((row) => {
        if (!q) return true;
        const haystack = [row.schoolName, row.title, row.location, row.urlSlug]
          .map((v) => String(v ?? "").toLowerCase())
          .join(" ");
        return haystack.includes(q);
      });

      const formatted = filtered.map((row) => ({
        School: row.schoolName || "",
        Location: row.location || "",
        Title: row.title || "",
        Slug: row.urlSlug || "",
        Description: row.description || "",
      }));

      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "FrontendPages");
      XLSX.writeFile(wb, "Frontend_Pages_List.xlsx");
    } catch (err) {
      setError(err?.message || "Failed to export Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row));
    onNavigate?.("frontend-page-create");
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete frontend page "${row.title}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteFrontendPage(row.id);
      await loadRows();
    } catch (err) {
      setError(err?.message || "Failed to delete page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Frontend Page</h1>
          <span className="text-secondary-light">Frontend / Frontend Page</span>
        </div>
        {canAdd(PAGE_SLUG) && (
          <button 
            className="btn btn-primary-600 d-flex align-items-center gap-6" 
            onClick={() => {
              sessionStorage.removeItem(EDIT_STORAGE_KEY);
              onNavigate?.("frontend-page-create");
            }}
          >
            <i className="ri-add-large-line"></i> Add Frontend Page
          </button>
        )}
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-24" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />

              <button 
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" 
                onClick={() => setIsFilterOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button 
                  type="button" 
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" 
                  data-bs-toggle="dropdown"
                >
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

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(next);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="position-relative">
              <input 
                type="text" 
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" 
                placeholder="Search..." 
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
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading frontend pages...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {visibleColumns.school && <td>{row.schoolName || "-"}</td>}
                      {visibleColumns.location && <td>{row.location}</td>}
                      {visibleColumns.title && (
                        <td>
                          <span className="fw-medium text-primary-light">{row.title}</span>
                        </td>
                      )}
                      {visibleColumns.urlSlug && <td>{row.urlSlug}</td>}
                      {visibleColumns.image && (
                        <td>
                          <img 
                            src={row.image || "https://via.placeholder.com/40"} 
                            alt="" 
                            className="w-40-px h-40-px radius-8 object-fit-cover" 
                          />
                        </td>
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button 
                              className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => handleEdit(row)}
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          )}
                          {canDelete(PAGE_SLUG) && (
                            <button 
                              className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => handleDelete(row)}
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

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find Page">
        <form 
          className="p-20 d-grid gap-16" 
          onSubmit={(e) => {
            e.preventDefault();
            setIsFilterOpen(false);
            setCurrentPage(1);
          }}
        >
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, "");
                setFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: "Select" }));
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value);
                setFilters((prev) => ({ ...prev, schoolId: value || "Select" }));
              }}
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <select 
                className="form-control form-select" 
                value={filters.schoolId} 
                onChange={(e) => setFilters((prev) => ({ ...prev, schoolId: e.target.value || "Select" }))}
              >
                <option value="Select">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary-600 w-100">Apply Filter</button>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default FrontendPage;
