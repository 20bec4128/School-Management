import { useCallback, useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import useColumnVisibility from "../hooks/useColumnVisibility";
import {
  deleteEmployee,
  fetchEmployeesPage,
} from "../apis/employeesApi";
import { fetchDesignations } from "../apis/designationsApi";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { normalizeRole } from "../utils/roles";
import "../assets/css/addModalShared.css";
import ExportDropdown from "../components/ExportDropdown";

const EDIT_STORAGE_KEY = "edit-employee-row";

const columnOptions = [
  { key: "school", label: "School" },
  { key: "photo", label: "Photo" },
  { key: "name", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "isViewOnWeb", label: "Is View on Web?" },
  { key: "displayOrder", label: "Display Order" },
];

const getRowSchoolName = (row, schoolById, fallbackSchoolName) => {
  if (!row) return "";
  if (row.schoolName) return row.schoolName;

  const schoolId = row.schoolId != null ? String(row.schoolId) : "";
  const lookup = schoolById.get(schoolId);

  return (
    lookup?.schoolName ||
    fallbackSchoolName ||
    (schoolId ? `School ${schoolId}` : "")
  );
};

const ManageEmployee = ({ onNavigate }) => {
  const {
    status,
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    canAdd,
    canEdit,
    canDelete,
  } = useAuth();
  const PAGE_SLUG = "manage-employee";

  const { activeSchoolId } = useSchool();

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
  const isHeadOfficeAdmin = normalizedRole === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = normalizedRole === "SCHOOL_ADMIN";

  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [designationCache, setDesignationCache] = useState({});

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    name: "",
    headOfficeId: "All",
    schoolId: "All",
    designation: "All",
    email: "",
    joiningDate: "",
    isViewOnWeb: "All",
  });

  const [pendingFilters, setPendingFilters] = useState({
    name: "",
    headOfficeId: "All",
    schoolId: "All",
    designation: "All",
    email: "",
    joiningDate: "",
    isViewOnWeb: "All",
  });

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  const currentSchoolOption = useMemo(() => {
    if (!authSchoolId) return null;

    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    };
  }, [authHeadOfficeId, authSchoolId, authSchoolName]);

  const schoolById = useMemo(() => {
    const map = new Map();

    for (const item of schools) {
      if (item?.id == null) continue;
      map.set(String(item.id), item);
    }

    if (
      currentSchoolOption?.id != null &&
      !map.has(String(currentSchoolOption.id))
    ) {
      map.set(String(currentSchoolOption.id), currentSchoolOption);
    }

    return map;
  }, [currentSchoolOption, schools]);

  const loadDesignationCacheForSchools = useCallback(async (schoolIds) => {
    const uniqueIds = Array.from(
      new Set(
        (Array.isArray(schoolIds) ? schoolIds : [])
          .map((id) => String(id ?? "").trim())
          .filter(Boolean),
      ),
    );

    if (uniqueIds.length === 0) return;

    const results = await Promise.allSettled(
      uniqueIds.map((schoolId) => fetchDesignations({ schoolId })),
    );

    setDesignationCache((prev) => {
      const next = { ...prev };

      uniqueIds.forEach((schoolId, index) => {
        const result = results[index];

        if (result?.status === "fulfilled") {
          next[schoolId] = Array.isArray(result.value) ? result.value : [];
        }
      });

      return next;
    });
  }, []);

  const loadScopeLookups = useCallback(async () => {
    if (status !== "ready") return;

    try {
      if (isSuperAdmin) {
        const [headOfficePage, schoolList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ]);

        setHeadOffices(
          Array.isArray(headOfficePage?.content)
            ? headOfficePage.content
            : [],
        );
        setSchools(Array.isArray(schoolList) ? schoolList : []);
      } else if (isHeadOfficeAdmin) {
        const schoolList = await fetchSchoolsLookup();
        const targetHeadOfficeId =
          authHeadOfficeId != null ? String(authHeadOfficeId) : "";

        const filteredSchools = (Array.isArray(schoolList) ? schoolList : [])
          .filter(
            (school) =>
              String(school?.headOfficeId ?? "") === targetHeadOfficeId,
          );

        setSchools(filteredSchools);
        setHeadOffices([]);
      } else if (isSchoolAdmin) {
        setSchools(currentSchoolOption ? [currentSchoolOption] : []);
        setHeadOffices(
          authHeadOfficeId != null
            ? [
                {
                  id: authHeadOfficeId,
                  name:
                    authHeadOfficeName ||
                    `Head Office ${authHeadOfficeId}`,
                },
              ]
            : [],
        );
      } else {
        setHeadOffices([]);
        setSchools([]);
      }
    } catch {
      setHeadOffices([]);
      setSchools(
        isSchoolAdmin && currentSchoolOption ? [currentSchoolOption] : [],
      );
    }
  }, [
    authHeadOfficeId,
    authHeadOfficeName,
    currentSchoolOption,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    isSuperAdmin,
    status,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadRows = useCallback(async () => {
    if (status !== "ready") return;

    if (isHeadOfficeAdmin && !activeSchoolId) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setBusy(false);
      setError("");
      setSelectedRows([]);
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
        : "";

    setBusy(true);
    setError("");

    try {
      const data = await fetchEmployeesPage({
        schoolId: effectiveSchoolId,
        page: currentPage - 1,
        size: rowsPerPage === -1 ? 999999 : rowsPerPage,
        search: debouncedSearch,
      });

      const normalizedRows = Array.isArray(data?.content)
        ? data.content
        : [];

      setRows(normalizedRows);
      setTotalElements(data?.totalElements ?? 0);
      setTotalPages(data?.totalPages ?? 0);
      setSelectedRows([]);

      const schoolIdsToPrime = isSuperAdmin
        ? normalizedRows
            .map((row) => row?.schoolId)
            .filter((id) => id != null)
        : effectiveSchoolId
          ? [effectiveSchoolId]
          : [];

      void loadDesignationCacheForSchools(schoolIdsToPrime);
    } catch (e) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setSelectedRows([]);
      setError(e?.message || "Failed to load employees");
    } finally {
      setBusy(false);
    }
  }, [
    activeSchoolId,
    authSchoolId,
    currentPage,
    debouncedSearch,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    isSuperAdmin,
    loadDesignationCacheForSchools,
    rowsPerPage,
    status,
  ]);

  useEffect(() => {
    void loadScopeLookups();
  }, [loadScopeLookups]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const displayRows = useMemo(() => {
    return rows.map((row) => {
      const schoolId = row?.schoolId != null ? String(row.schoolId) : "";
      const designationId =
        row?.designationId != null ? String(row.designationId) : "";

      const schoolName = getRowSchoolName(
        row,
        schoolById,
        currentSchoolOption?.schoolName || authSchoolName || "",
      );

      const designationName =
        row?.designationName ||
        (schoolId && designationId && designationCache[schoolId]
          ? designationCache[schoolId].find(
              (item) => String(item?.id) === designationId,
            )?.name || ""
          : "") ||
        "";

      return {
        ...row,
        schoolId,
        schoolName,
        designationId,
        designationName,
      };
    });
  }, [
    authSchoolName,
    currentSchoolOption?.schoolName,
    designationCache,
    rows,
    schoolById,
  ]);

  const filteredRows = useMemo(() => {
    return displayRows.filter((row) => {
      const matchesName =
        !filters.name ||
        String(row.name || "")
          .toLowerCase()
          .includes(filters.name.toLowerCase());

      const rowHeadOfficeId = schoolById.get(String(row.schoolId ?? ""))?.headOfficeId ?? null;
      const matchesHeadOffice =
        filters.headOfficeId === "All" ||
        String(rowHeadOfficeId ?? "") === String(filters.headOfficeId);

      const matchesSchool =
        filters.schoolId === "All" || String(row.schoolId) === filters.schoolId;

      const matchesDesignation =
        filters.designation === "All" ||
        String(row.designationName || "") === filters.designation;

      const matchesEmail =
        !filters.email ||
        String(row.email || "")
          .toLowerCase()
          .includes(filters.email.toLowerCase());

      const matchesJoiningDate =
        !filters.joiningDate || row.joiningDate === filters.joiningDate;

      const matchesWeb =
        filters.isViewOnWeb === "All" ||
        String(row.isViewOnWeb || "") === filters.isViewOnWeb;

      return (
        matchesName &&
        matchesHeadOffice &&
        matchesSchool &&
        matchesDesignation &&
        matchesEmail &&
        matchesJoiningDate &&
        matchesWeb
      );
    });
  }, [displayRows, filters, schoolById]);

  const schoolOptionsForFilter = useMemo(() => {
    const map = new Map();

    const selectedFilterHeadOfficeId =
      pendingFilters.headOfficeId !== "All"
        ? String(pendingFilters.headOfficeId)
        : isHeadOfficeAdmin
          ? String(authHeadOfficeId ?? "")
          : "";

    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id == null) continue;
      if (
        isHeadOfficeAdmin &&
        String(school?.headOfficeId ?? "") !== String(authHeadOfficeId ?? "")
      ) {
        continue;
      }
      if (
        isSuperAdmin &&
        selectedFilterHeadOfficeId &&
        String(school?.headOfficeId ?? "") !== selectedFilterHeadOfficeId
      ) {
        continue;
      }
      map.set(String(school.id), {
        id: String(school.id),
        schoolName: school.schoolName || school.name || `School ${school.id}`,
        headOfficeId: school.headOfficeId ?? null,
      });
    }

    return Array.from(map.entries())
      .map(([, item]) => item)
      .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)));
  }, [schools, pendingFilters.headOfficeId, isHeadOfficeAdmin, isSuperAdmin, authHeadOfficeId]);

  const headOfficeOptionsForFilter = useMemo(
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

  const designationOptionsForFilter = useMemo(() => {
    const map = new Map();

    for (const row of displayRows) {
      const key = String(row.designationName || "").trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, key);
    }

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [displayRows]);

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
        prev.filter(
          (id) => !filteredRows.some((row) => row.id === id),
        ),
      );
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id],
    );
  };

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target;
    if (id === "headOfficeId") {
      setPendingFilters((prev) => ({
        ...prev,
        headOfficeId: value,
        schoolId: "All",
      }));
      return;
    }

    setPendingFilters((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const clearEditState = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY);
    } catch {
      // Ignore storage failures and keep navigation working.
    }
  };

  const saveEditState = (row) => {
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row));
    } catch {
      // Ignore storage failures and keep navigation working.
    }
  };

  const openAdd = () => {
    clearEditState();
    navigateTo("add-manage-employee");
  };

  const openEdit = (row) => {
    saveEditState(row);
    navigateTo("add-manage-employee");
  };

  const handleDelete = async (id) => {
    if (!id) return;

    const ok = window.confirm("Delete this employee? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError("");

    try {
      await deleteEmployee(id);
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
      await loadRows();
    } catch (e) {
      setError(e?.message || "Failed to delete employee");
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
    isHeadOfficeAdmin && !activeSchoolId
      ? "Select a school to view employees."
      : busy
        ? "Loading employees..."
        : "No employees found.";

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Manage Employee
          </h1>

          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Manage Employee</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          {canAdd(PAGE_SLUG) && (
            <button
              type="button"
              className="btn btn-primary-600 d-flex align-items-center gap-6"
              onClick={openAdd}
            >
              <span className="d-flex text-md">
                <i className="ri-add-large-line"></i>
              </span>
              Add Employee
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      {isHeadOfficeAdmin && !activeSchoolId ? (
        <div className="alert alert-info d-flex align-items-center gap-8 mb-16">
          <i className="ri-information-line"></i>
          <span>Please choose a school from the topbar to load employees.</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
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

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
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
                placeholder="Search employee..."
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
              style={{ minWidth: 900 }}
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
                      <label className="form-check-label">ID</label>
                    </div>
                  </th>

                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.designation ? (
                    <th scope="col">Designation</th>
                  ) : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  {visibleColumns.joiningDate ? (
                    <th scope="col">Joining Date</th>
                  ) : null}
                  {visibleColumns.isViewOnWeb ? (
                    <th scope="col">Is View on Web?</th>
                  ) : null}
                  {visibleColumns.displayOrder ? (
                    <th scope="col">Display Order</th>
                  ) : null}

                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {busy || (!activeSchoolId && isHeadOfficeAdmin) ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">{row.id}</label>
                        </div>
                      </td>

                      {visibleColumns.school ? (
                        <td>{row.schoolName || "-"}</td>
                      ) : null}

                      {visibleColumns.photo ? (
                        <td>
                          <div
                            className="w-40-px h-40-px rounded-circle bg-neutral-200 d-flex align-items-center justify-content-center overflow-hidden"
                            style={{ minWidth: 40 }}
                          >
                            {row.photoUrl ? (
                              <img
                                src={row.photoUrl}
                                alt={row.name}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-user-line text-secondary-light"></i>
                            )}
                          </div>
                        </td>
                      ) : null}

                      {visibleColumns.name ? (
                        <td className="fw-medium text-primary-light">
                          {row.name || "-"}
                        </td>
                      ) : null}

                      {visibleColumns.designation ? (
                        <td>{row.designationName || "-"}</td>
                      ) : null}

                      {visibleColumns.phone ? <td>{row.phone || "-"}</td> : null}
                      {visibleColumns.email ? <td>{row.email || "-"}</td> : null}

                      {visibleColumns.joiningDate ? (
                        <td>{row.joiningDate || "-"}</td>
                      ) : null}

                      {visibleColumns.isViewOnWeb ? (
                        <td>
                          <div className="form-check form-switch d-flex justify-content-center mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={
                                String(row.isViewOnWeb || "").toLowerCase() ===
                                "yes"
                              }
                              readOnly
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </td>
                      ) : null}

                      {visibleColumns.displayOrder ? (
                        <td className="text-center">
                          {row.displayOrder ?? "-"}
                        </td>
                      ) : null}

                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {canEdit(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => openEdit(row)}
                              title="Edit"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          )}

                          {canDelete(PAGE_SLUG) && (
                            <button
                              type="button"
                              className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              title="Delete"
                              onClick={() => handleDelete(row.id)}
                              disabled={saving}
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
              {totalElements === 0
                ? 0
                : (currentPage - 1) * rowsPerPage + 1}{" "}
              -{" "}
              {rowsPerPage === -1
                ? totalElements
                : Math.min(currentPage * rowsPerPage, totalElements)}{" "}
              of {totalElements}
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
                  setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
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
        title="Filter Employees"
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
          <div>
            <label
              htmlFor="filterEmployeeName"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Name
            </label>
            <input
              id="filterEmployeeName"
              type="text"
              className="form-control"
              value={pendingFilters.name}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Search by name"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <ManualScopeSelectors
              enabled={isSuperAdmin || isHeadOfficeAdmin || isSchoolAdmin}
              headOffices={isSuperAdmin ? headOfficeOptionsForFilter : []}
              schoolOptions={schoolOptionsForFilter}
              selectedHeadOfficeId={
                isSuperAdmin
                  ? pendingFilters.headOfficeId
                  : isHeadOfficeAdmin
                    ? String(authHeadOfficeId ?? "")
                    : ""
              }
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
              htmlFor="filterEmployeeDesignation"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Designation
            </label>
            <select
              id="filterEmployeeDesignation"
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
              {designationOptionsForFilter.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filterEmployeeEmail"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Email
            </label>
            <input
              id="filterEmployeeEmail"
              type="text"
              className="form-control"
              value={pendingFilters.email}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Search by email"
            />
          </div>

          <div>
            <label
              htmlFor="filterEmployeeJoiningDate"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Joining Date
            </label>
            <input
              id="filterEmployeeJoiningDate"
              type="date"
              className="form-control"
              value={pendingFilters.joiningDate}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  joiningDate: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="filterEmployeeWeb"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Is View on Web?
            </label>
            <select
              id="filterEmployeeWeb"
              className="form-control form-select"
              value={pendingFilters.isViewOnWeb}
              onChange={(e) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  isViewOnWeb: e.target.value,
                }))
              }
            >
              <option value="All">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-danger-200 text-danger-600 w-100"
              onClick={() => {
                const reset = {
                  name: "",
                  headOfficeId: "All",
                  schoolId: "All",
                  designation: "All",
                  email: "",
                  joiningDate: "",
                  isViewOnWeb: "All",
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

export default ManageEmployee;
