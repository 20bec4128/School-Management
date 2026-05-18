import { useCallback, useEffect, useMemo, useState } from "react";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import {
  deleteSuperAdmin,
  fetchSuperAdminsPage,
} from "../apis/superAdminApi";
import { useAuth } from "../context/useAuth";
import ExportDropdown from "../components/ExportDropdown";

const EDIT_STORAGE_KEY = "edit-super-admin-row";

const columnOptions = [
  { key: "photo", label: "Photo" },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
];

const emptyFilters = {
  name: "",
  email: "",
  phone: "",
};

const SuperAdmin = ({ onNavigate }) => {
  const { status, user, role } = useAuth();
  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  const currentUserName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "Current Super Admin";
  const currentUserEmail = user?.email || "-";
  const currentUserUsername = user?.username || "-";
  const currentUserRole =
    role || user?.role || user?.userRole || user?.authority || "SUPER_ADMIN";
  const activeFilterCount = useMemo(
    () =>
      [filters.name, filters.email, filters.phone].filter((value) => String(value || "").trim())
        .length,
    [filters],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadRows = useCallback(async () => {
    if (status !== "ready") return;

    setBusy(true);
    setError("");

    try {
      const data = await fetchSuperAdminsPage({
        page: currentPage - 1,
        size: rowsPerPage === -1 ? 999999 : rowsPerPage,
        search: debouncedSearch,
        name: filters.name,
        email: filters.email,
        phone: filters.phone,
      });

      setRows(Array.isArray(data?.content) ? data.content : []);
      setTotalElements(data?.totalElements ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } catch (e) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setError(e?.message || "Failed to load super admins");
    } finally {
      setBusy(false);
    }
  }, [currentPage, debouncedSearch, filters, rowsPerPage, status]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const clearEditState = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const saveEditState = (row) => {
    try {
      sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row));
    } catch {
      // ignore
    }
  };

  const openAdd = () => {
    clearEditState();
    navigateTo("add-super-admin");
  };

  const openEdit = (row) => {
    saveEditState(row);
    navigateTo("add-super-admin");
  };

  const handleDelete = async (id) => {
    if (!id) return;

    const ok = window.confirm("Delete this super admin? This cannot be undone.");
    if (!ok) return;

    setSaving(true);
    setError("");

    try {
      await deleteSuperAdmin(id);
      await loadRows();
    } catch (e) {
      setError(e?.message || "Failed to delete super admin");
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

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target;
    setPendingFilters((prev) => ({ ...prev, [id]: value }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setFilters(pendingFilters);
    setCurrentPage(1);
    setIsFilterSidebarOpen(false);
  };

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
    setIsFilterSidebarOpen(false);
  };

  return (
    <div className="dashboard-main-body">
      {/* Header & Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-start justify-content-between gap-3 mb-24">
        <div className="d-flex flex-column gap-1">
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Manage Super Admin
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / Manage Super Admin</span>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-primary-600 d-inline-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Super Admin
          </button>
        </div>
      </div>

      <div className="card border border-primary-200 mb-20">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-16">
          <div>
            <div className="text-sm text-secondary-light mb-6">Current Session</div>
            <div className="fw-semibold text-primary-light">{currentUserName}</div>
            <div className="text-sm text-secondary-light">@{currentUserUsername}</div>
          </div>
          <div className="d-flex flex-wrap gap-12">
            <span className="px-12 py-8 radius-8 bg-primary-50 text-primary-600 text-sm fw-medium">
              {currentUserRole}
            </span>
            <span className="px-12 py-8 radius-8 bg-neutral-100 text-secondary-light text-sm fw-medium">
              {currentUserEmail}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-20">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Grid Table Container */}
      <div className="card h-100 border border-neutral-200">
        <div className="card-body p-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button
                type="button"
                className="px-12 py-6 border border-neutral-300 radius-8 d-inline-flex align-items-center gap-8 bg-white text-secondary-light text-sm"
                onClick={() => {
                  setPendingFilters(filters);
                  setIsFilterSidebarOpen(true);
                }}
              >
                <i className="ri-filter-3-line" />
                <span>Filter</span>
                {activeFilterCount > 0 ? (
                  <span className="bg-primary-600 text-white px-8 py-2 radius-4 text-xs fw-semibold">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              {/* Columns Selector */}
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
            </div>

            {/* Search Input */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search super admin..."
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

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "80px" }}>#SL</th>
                  {visibleColumns.photo && <th scope="col">Photo</th>}
                  {visibleColumns.name && <th scope="col">Name</th>}
                  {visibleColumns.phone && <th scope="col">Phone</th>}
                  {visibleColumns.email && <th scope="col">Email</th>}
                  <th scope="col" className="text-center" style={{ width: "120px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {busy ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
                      <div>Loading super admins...</div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No super admins found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      {visibleColumns.photo && (
                        <td>
                          <div
                            className="w-40-px h-40-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center overflow-hidden border border-neutral-200"
                            style={{ minWidth: 40 }}
                          >
                            {row.photoUrl ? (
                              <img
                                src={row.photoUrl}
                                alt={row.name}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-user-3-line text-secondary-light text-lg"></i>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="fw-medium text-primary-light">{row.name || "-"}</td>
                      )}
                      {visibleColumns.phone && <td>{row.phone || "-"}</td>}
                      {visibleColumns.email && <td>{row.email || "-"}</td>}
                      <td>
                        <div className="d-flex align-items-center justify-content-center gap-10">
                          <button
                            type="button"
                            className="w-32-px h-32-px bg-success-50 text-success-600 rounded-circle d-flex align-items-center justify-content-center border-0"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="w-32-px h-32-px bg-danger-50 text-danger-600 rounded-circle d-flex align-items-center justify-content-center border-0"
                            onClick={() => handleDelete(row.id)}
                            disabled={saving}
                            title="Delete"
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

          {/* Pagination Footer */}
          {!busy && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-12 px-20 py-16 border-top border-neutral-200">
              <span className="text-secondary-light text-sm">
                Showing {rows.length} of {totalElements} entries
              </span>

              <div className="d-flex align-items-center gap-12">
                <span className="text-secondary-light text-sm">
                  Page {totalPages > 0 ? currentPage : 0} of {totalPages || 0}
                </span>
                <ul className="pagination d-flex align-items-center gap-8 mb-0">
                  <li className={`page-item ${currentPage === 1 || totalPages === 0 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link w-32-px h-32-px rounded-circle d-flex align-items-center justify-content-center p-0 border border-neutral-300"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || totalPages === 0}
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                  </li>
                  {(totalPages > 0 ? getVisiblePages() : [1]).map((page) => (
                    <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                      <button
                        type="button"
                        className={`page-link w-32-px h-32-px rounded-circle d-flex align-items-center justify-content-center p-0 border ${
                          currentPage === page
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "border-neutral-300 text-secondary-light"
                        }`}
                        onClick={() => setCurrentPage(page)}
                        disabled={totalPages === 0}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link w-32-px h-32-px rounded-circle d-flex align-items-center justify-content-center p-0 border border-neutral-300"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Super Admin"
        onClose={() => setIsFilterSidebarOpen(false)}
      >
        <form className="p-20" onSubmit={handleApplyFilters}>
          <div className="mb-16">
            <label htmlFor="name" className="form-label fw-semibold text-primary-light mb-8 d-block">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder="Search by name"
              value={pendingFilters.name}
              onChange={handlePendingFilterChange}
            />
          </div>

          <div className="mb-16">
            <label htmlFor="email" className="form-label fw-semibold text-primary-light mb-8 d-block">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Search by email"
              value={pendingFilters.email}
              onChange={handlePendingFilterChange}
            />
          </div>

          <div className="mb-16">
            <label htmlFor="phone" className="form-label fw-semibold text-primary-light mb-8 d-block">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              className="form-control"
              placeholder="Search by phone"
              value={pendingFilters.phone}
              onChange={handlePendingFilterChange}
            />
          </div>

          <div className="d-flex align-items-center justify-content-between gap-12 pt-8">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <div className="d-flex align-items-center gap-12">
              <button
                type="button"
                className="btn btn-light border"
                onClick={() => setIsFilterSidebarOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600">
                Apply
              </button>
            </div>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default SuperAdmin;
