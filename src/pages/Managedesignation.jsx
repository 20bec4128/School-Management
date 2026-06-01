import { useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import useColumnVisibility from "../hooks/useColumnVisibility";
import "../assets/css/addModalShared.css";

import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import {
  deleteDesignation,
  fetchDesignationsPage,
} from "../apis/designationsApi";
import { normalizeRole } from "../utils/roles";
import ExportDropdown from "../components/ExportDropdown";

const EDIT_STORAGE_KEY = "edit-designation-row";

const columnOptions = [
  { key: "school", label: "School Name" },
  { key: "role", label: "Role" },
  { key: "designation", label: "Designation" },
  { key: "note", label: "Note" },
];

const formatRoleLabel = (value) => {
  const v = String(value || "")
    .trim()
    .toUpperCase()
    .replaceAll("_", " ");
  return v ? v.replace(/\b\w/g, (m) => m.toUpperCase()) : "";
};

const ManageDesignation = ({ onNavigate }) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth();
  const { activeSchoolId } = useSchool();
  const PAGE_SLUG = "manage-designation";

  const role = useMemo(
    () =>
      normalizeRole(
        authRole || user?.role || user?.userRole || user?.authority,
      ),
    [authRole, user],
  );

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isHeadOfficeAdmin = role === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";

  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  const [filters, setFilters] = useState({
    headOfficeId: "All",
    schoolId: "All",
    designation: "All",
  });

  const [pendingFilters, setPendingFilters] = useState({
    headOfficeId: "All",
    schoolId: "All",
    designation: "All",
  });

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  const schoolsById = useMemo(() => {
    const map = new Map();

    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id == null) continue;
      map.set(String(school.id), school);
    }

    return map;
  }, [schools]);

  const resolveSchoolName = (schoolId, fallbackName = "") => {
    if (schoolId == null) return "";
    const row = schoolsById.get(String(schoolId));
    return row?.schoolName || row?.name || fallbackName || "";
  };

  const getListingSchoolId = () => {
    if (isSchoolAdmin) return authSchoolId != null ? authSchoolId : null;
    if (isHeadOfficeAdmin) return activeSchoolId ? Number(activeSchoolId) : null;
    return null;
  };

  const loadLookups = async () => {
    if (isSchoolAdmin) return;

    const tasks = [];

    if (isSuperAdmin) {
      tasks.push(
        fetchHeadOfficesPage(0, 500)
          .then((page) => {
            const content = Array.isArray(page?.content) ? page.content : [];
            setHeadOffices(content);
          })
          .catch(() => {}),
      );
    }

    tasks.push(
      fetchSchoolsLookup()
        .then((list) => setSchools(Array.isArray(list) ? list : []))
        .catch(() => setSchools([])),
    );

    await Promise.all(tasks);
  };

  const loadDesignations = async ({
    schoolId,
    page = 0,
    size = 10,
    search = "",
  } = {}) => {
    const effectiveSchoolId = (() => {
      if (isSchoolAdmin) return authSchoolId;
      if (isHeadOfficeAdmin) return schoolId ?? null;
      if (isSuperAdmin) return schoolId ?? null;
      return null;
    })();

    if (!effectiveSchoolId && !isSuperAdmin) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      return;
    }

    const data = await fetchDesignationsPage({
      schoolId: effectiveSchoolId,
      page,
      size: size === -1 ? 999999 : size,
      search,
    });

    const list = Array.isArray(data?.content) ? data.content : [];

    setRows(
      list.map((designation) => ({
        id: designation?.id,
        schoolId: designation?.schoolId ?? effectiveSchoolId,
        schoolName:
          designation?.schoolName ||
          resolveSchoolName(
            designation?.schoolId ?? effectiveSchoolId,
            isSchoolAdmin
              ? authSchoolName ||
                  (authSchoolId != null ? `School ${authSchoolId}` : "")
              : "",
          ),
        role: designation?.role ?? "",
        designation: designation?.name ?? designation?.designation ?? "",
        note: designation?.note ?? "",
      })),
    );

    setTotalElements(data?.totalElements ?? 0);
    setTotalPages(data?.totalPages ?? 0);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (status !== "ready" || !token) return;

    setLoadError("");
    setBusy(true);

    Promise.resolve()
      .then(loadLookups)
      .then(() => {
        const initialSchoolId = getListingSchoolId();

        return loadDesignations({
          schoolId: initialSchoolId,
          page: currentPage - 1,
          size: rowsPerPage,
          search: debouncedSearch,
        });
      })
      .catch((e) => setLoadError(e?.message || "Failed to load designations"))
      .finally(() => setBusy(false));
  }, [status, token, role, currentPage, rowsPerPage, debouncedSearch, activeSchoolId]);

  useEffect(() => {
    if (status !== "ready" || !token || isSchoolAdmin || isSuperAdmin) return;

    const schoolId = activeSchoolId ? Number(activeSchoolId) : null;

    if (!schoolId) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      return;
    }

    setLoadError("");
    setBusy(true);

    loadDesignations({
      schoolId,
      page: currentPage - 1,
      size: rowsPerPage,
      search: debouncedSearch,
    })
      .catch((e) => setLoadError(e?.message || "Failed to load designations"))
      .finally(() => setBusy(false));
  }, [
    status,
    token,
    isSchoolAdmin,
    isSuperAdmin,
    activeSchoolId,
    currentPage,
    rowsPerPage,
    debouncedSearch,
  ]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const rowHeadOfficeId = schoolsById.get(String(row.schoolId ?? ""))?.headOfficeId ?? null;
      const matchesHeadOffice =
        filters.headOfficeId === "All" ||
        String(rowHeadOfficeId ?? "") === String(filters.headOfficeId);
      const matchesSchool =
        filters.schoolId === "All" || String(row.schoolId ?? "") === String(filters.schoolId);

      const matchesDesignation =
        filters.designation === "All" ||
        row.designation === filters.designation;

      return matchesHeadOffice && matchesSchool && matchesDesignation;
    });
  }, [filters, rows, schoolsById]);

  const selectedFilterHeadOfficeId =
    isSuperAdmin ? pendingFilters.headOfficeId : isHeadOfficeAdmin ? String(authHeadOfficeId ?? "") : "";

  const schoolOptions = useMemo(() => {
    const map = new Map();
    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id == null) continue;
      if (isHeadOfficeAdmin && String(school?.headOfficeId ?? "") !== String(authHeadOfficeId ?? "")) continue;
      if (isSuperAdmin && selectedFilterHeadOfficeId && String(school?.headOfficeId ?? "") !== String(selectedFilterHeadOfficeId)) continue;
      map.set(String(school.id), {
        id: String(school.id),
        schoolName: school.schoolName || school.name || `School ${school.id}`,
        headOfficeId: school.headOfficeId ?? null,
      });
    }
    return Array.from(map.entries())
      .map(([, value]) => value)
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)));
  }, [schools, isHeadOfficeAdmin, authHeadOfficeId, isSuperAdmin, selectedFilterHeadOfficeId]);

  const headOfficeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          (Array.isArray(headOffices) ? headOffices : [])
            .filter((item) => item?.id != null)
            .map((item) => [String(item.id), item]),
        ).values(),
      )
        .map((item) => ({
          id: String(item.id),
          name: item.name || item.headOfficeName || `Head Office ${item.id}`,
        }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [headOffices],
  );

  const designationOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((item) => item.designation).filter(Boolean))),
    [rows],
  );

  const allSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedRows.includes(String(row.id)));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [
        ...new Set([...prev, ...filteredRows.map((row) => String(row.id))]),
      ]);
    } else {
      setSelectedRows((prev) =>
        prev.filter((id) => !filteredRows.some((row) => String(row.id) === id)),
      );
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const openAdd = () => {
    sessionStorage.removeItem(EDIT_STORAGE_KEY);
    navigateTo("add-manage-designation");
  };

  const openEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row));
    navigateTo("add-manage-designation");
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;

    const confirmed = window.confirm("Delete this designation?");
    if (!confirmed) return;

    setLoadError("");
    setBusy(true);

    try {
      await deleteDesignation(row.id);

      const nextSchoolId = getListingSchoolId();

      await loadDesignations({
        schoolId: nextSchoolId,
        page: currentPage - 1,
        size: rowsPerPage,
        search: debouncedSearch,
      });
    } catch (e) {
      setLoadError(e?.message || "Failed to delete designation");
    } finally {
      setBusy(false);
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

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Manage Designation
          </h1>

          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Manage Designation</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          {canAdd(PAGE_SLUG) && (
            <button
              type="button"
              className="btn btn-primary-600 d-flex align-items-center gap-6"
              onClick={() => navigateTo("add-manage-designation")}
            >
              <span className="d-flex text-md">
                <i className="ri-add-large-line" />
              </span>
              Add Designation
            </button>
          )}
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          {loadError ? (
            <div className="alert alert-danger d-flex align-items-center gap-8 m-20">
              <i className="ri-error-warning-line" />
              <span>{loadError}</span>
            </div>
          ) : null}

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line" />
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

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line" />
                </span>
              </button>

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search designation..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table
              className="table bordered-table mb-0 data-table"
              style={{ minWidth: 700 }}
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

                  {visibleColumns.school ? (
                    <th scope="col">School Name</th>
                  ) : null}
                  {visibleColumns.role ? <th scope="col">Role</th> : null}
                  {visibleColumns.designation ? (
                    <th scope="col">Designation</th>
                  ) : null}
                  {visibleColumns.note ? <th scope="col">Note</th> : null}

                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {busy ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      Loading designations...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      {isHeadOfficeAdmin && !activeSchoolId
                        ? "Select a school from the topbar to load designations."
                        : "No designations found."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr key={String(row.id)}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(String(row.id))}
                            onChange={() => handleSelectRow(String(row.id))}
                          />

                          <label className="form-check-label">
                            {(currentPage - 1) * rowsPerPage + index + 1}
                          </label>
                        </div>
                      </td>

                      {visibleColumns.school ? <td>{row.schoolName}</td> : null}

                      {visibleColumns.role ? (
                        <td>{formatRoleLabel(row.role) || "-"}</td>
                      ) : null}

                      {visibleColumns.designation ? (
                        <td className="fw-medium text-primary-light">
                          {row.designation}
                        </td>
                      ) : null}

                      {visibleColumns.note ? <td>{row.note || "-"}</td> : null}

                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => openEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line" />
                            </button>
                          )}

                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => handleDelete(row)}
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line" />
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
              {rowsPerPage === -1
                ? totalElements
                : Math.min(currentPage * rowsPerPage, totalElements)}{" "}
              of {totalElements}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Designations"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form
          className="p-20 d-grid grid-cols-2 gap-16"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters(pendingFilters);
            setCurrentPage(1);
            setIsFilterSidebarOpen(false);
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <ManualScopeSelectors
              enabled={isSuperAdmin || isHeadOfficeAdmin}
              headOffices={isSuperAdmin ? headOfficeOptions : []}
              schoolOptions={schoolOptions}
              selectedHeadOfficeId={selectedFilterHeadOfficeId}
              onHeadOfficeChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  headOfficeId: value || "All",
                  schoolId: "All",
                }))
              }
              selectedSchoolId={pendingFilters.schoolId}
              onSchoolChange={(value) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  schoolId: value || "All",
                }))
              }
              showSchoolSelector
              showHeadOfficeSelector={isSuperAdmin}
              compact={false}
            />
          </div>

          <div>
            <label
              htmlFor="filterDesignation"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Designation
            </label>

            <select
              id="filterDesignation"
              className="form-control form-select"
              value={pendingFilters.designation}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  designation: e.target.value,
                }))
              }
            >
              <option value="All">All</option>
              {designationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const reset = {
                  headOfficeId: "All",
                  schoolId: "All",
                  designation: "All",
                };

                setPendingFilters(reset);
                setFilters(reset);
                setCurrentPage(1);
              }}
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

export default ManageDesignation;
