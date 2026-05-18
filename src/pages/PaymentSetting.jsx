import { useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import ExportDropdown from "../components/ExportDropdown";
import "../assets/css/addModalShared.css";
import { useAuth } from "../context/useAuth";
import {
  fetchPaymentSettingsPage,
  deletePaymentSetting,
} from "../apis/paymentSettingApi";

const emptyFilters = {
  school: "Select",
  gateway: "Select",
};

const gatewayOptions = [
  "PayPal",
  "Stripe",
  "PayUMoney",
  "CCAvenue",
  "PayTM",
  "PayStack",
  "JazzCash",
  "SSLCommerz",
  "DBBL",
  "Midtrans",
  "InstaMojo",
  "FlutterWave",
  "iPay",
];

const columnOptions = [
  { key: "school", label: "School" },
  { key: "paypal", label: "PayPal" },
  { key: "payUMoney", label: "PayUMoney" },
  { key: "ccaVenue", label: "CCAvenue" },
  { key: "payTM", label: "PayTM" },
  { key: "payStack", label: "PayStack" },
];

const PaymentSetting = ({ onNavigate }) => {
  const { headOfficeId, schoolId } = useAuth();
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
      const data = await fetchPaymentSettingsPage({
        headOfficeId,
        schoolId,
        page: currentPage - 1,
        size: rowsPerPage,
        search: search,
      });
      setRows(data?.content || []);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      setError(err?.message || "Failed to load payment settings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, rowsPerPage, search, schoolId, headOfficeId]);

  const schoolOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows.map((item) => String(item?.school ?? "").trim()).filter(Boolean)
        )
      ).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesSchool =
        filters.school === "Select" || row.school === filters.school;
      return matchesSchool;
    });
  }, [filters, rows]);

  const totalPages = Math.max(1, Math.ceil(totalElements / rowsPerPage));

  const allSelected =
    filtered.length > 0 && filtered.every((row) => selectedRows.includes(row.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [
        ...new Set([...prev, ...filtered.map((row) => row.id)]),
      ]);
    } else {
      setSelectedRows((prev) =>
        prev.filter((id) => !filtered.some((row) => row.id === id))
      );
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
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
    sessionStorage.removeItem("PAYMENT_SETTING_EDIT_ID");
    onNavigate?.("payment-setting-create");
  };

  const openEdit = (row) => {
    sessionStorage.setItem("PAYMENT_SETTING_EDIT_ID", String(row.id));
    onNavigate?.("payment-setting-create");
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this payment settings configuration?"
      )
    )
      return;
    try {
      await deletePaymentSetting(row.id);
      setSelectedRows((prev) => prev.filter((id) => id !== row.id));
      loadData();
    } catch (err) {
      alert(err?.message || "Failed to remove entry item.");
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
            Payment Setting
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Payment Setting</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Payment Setting
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
                placeholder="Search payment settings..."
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
              style={{ minWidth: 1200 }}
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
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.paypal ? <th scope="col">PayPal</th> : null}
                  {visibleColumns.payUMoney ? <th scope="col">PayUMoney</th> : null}
                  {visibleColumns.ccaVenue ? <th scope="col">CCAvenue</th> : null}
                  {visibleColumns.payTM ? <th scope="col">PayTM</th> : null}
                  {visibleColumns.payStack ? <th scope="col">PayStack</th> : null}
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
                      Loading settings config...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No payment settings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {String(
                              idx + 1 + (currentPage - 1) * rowsPerPage
                            ).padStart(2, "0")}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">
                          {row.school}
                        </td>
                      ) : null}
                      {visibleColumns.paypal ? (
                        <td>{row.paypal || "-"}</td>
                      ) : null}
                      {visibleColumns.payUMoney ? (
                        <td>{row.payUMoney || "-"}</td>
                      ) : null}
                      {visibleColumns.ccaVenue ? (
                        <td>{row.ccaVenue || "-"}</td>
                      ) : null}
                      {visibleColumns.payTM ? (
                        <td>{row.payTM || "-"}</td>
                      ) : null}
                      {visibleColumns.payStack ? (
                        <td>{row.payStack || "-"}</td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => handleDelete(row)}
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
        title="Filter Payment Setting"
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

          <div style={{ gridColumn: "1 / -1" }}>
            <label
              htmlFor="gateway"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Gateway
            </label>
            <select
              id="gateway"
              className="form-control form-select"
              value={pendingFilters.gateway}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Gateway</option>
              {gatewayOptions.map((option) => (
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

export default PaymentSetting;
