import { useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import "../assets/css/addModalShared.css";
import { useAuth } from "../context/useAuth";
import {
  deleteEmailSetting,
  fetchEmailSettings,
} from "../apis/emailSettingApi";

const emptyFilters = {
  school: "Select",
  emailProtocol: "Select",
};

const EmailSetting = ({ onNavigate }) => {
  const { headOfficeId, schoolId } = useAuth();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchEmailSettings();
      let filteredData = Array.isArray(data) ? data : [];
      if (schoolId) {
        filteredData = filteredData.filter(
          (item) => String(item.schoolId) === String(schoolId),
        );
      } else if (headOfficeId) {
        filteredData = filteredData.filter(
          (item) => String(item.headOfficeId) === String(headOfficeId),
        );
      }
      setRows(filteredData);
    } catch (err) {
      setError(err?.message || "Failed to load email settings data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, headOfficeId]);

  const schoolOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((item) => String(item?.schoolName || item?.school || "").trim())
            .filter(Boolean),
        ),
      ).sort(),
    [rows],
  );

  const protocolOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((item) => String(item?.emailProtocol || "").trim())
            .filter(Boolean),
        ),
      ).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const schoolName = row.schoolName || row.school || "";
      const matchesSearch =
        !q ||
        [
          schoolName,
          row.emailProtocol,
          row.emailType,
          row.charSet,
          row.fromName,
          row.fromEmail,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesSchool =
        filters.school === "Select" || schoolName === filters.school;
      const matchesProtocol =
        filters.emailProtocol === "Select" ||
        String(row.emailProtocol).toLowerCase() ===
          String(filters.emailProtocol).toLowerCase();
      return matchesSearch && matchesSchool && matchesProtocol;
    });
  }, [rows, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [currentPage, filtered, rowsPerPage]);

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
    sessionStorage.removeItem("EMAIL_SETTING_EDIT_ID");
    onNavigate?.("email-setting-create");
  };

  const openEdit = (row) => {
    sessionStorage.setItem("EMAIL_SETTING_EDIT_ID", String(row.id));
    onNavigate?.("email-setting-create");
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this email setting?")) {
      return;
    }
    try {
      await deleteEmailSetting(row.id);
      loadData();
    } catch (err) {
      alert(err?.message || "Failed to remove email setting.");
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Email Setting</h1>
          <span className="text-secondary-light">Administrator / Email Setting</span>
        </div>
        <button
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <i className="ri-add-line"></i> Add Email Setting
        </button>
      </div>

      {error ? <div className="alert alert-danger mb-24 radius-8">{error}</div> : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <button
              className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
              onClick={() => setIsFilterSidebarOpen(true)}
            >
              <span className="text-secondary-light text-sm">Find</span>
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

            <div className="position-relative ms-auto">
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

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">S.L</th>
                  <th scope="col">School</th>
                  <th scope="col">Email Protocol</th>
                  <th scope="col">Email Type</th>
                  <th scope="col">Char Set</th>
                  <th scope="col">From Name</th>
                  <th scope="col">From Email</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-40 text-secondary-light">
                      Loading email settings...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-40 text-secondary-light">
                      No email settings found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => {
                    const schoolName = row.schoolName || row.school || "-";
                    return (
                      <tr key={row.id ?? idx}>
                        <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                        <td>{schoolName}</td>
                        <td>{row.emailProtocol || "-"}</td>
                        <td>{row.emailType || "-"}</td>
                        <td>{row.charSet || "-"}</td>
                        <td>{row.fromName || "-"}</td>
                        <td>{row.fromEmail || "-"}</td>
                        <td>
                          <div className="d-flex align-items-center gap-10">
                            <button
                              type="button"
                              className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => openEdit(row)}
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              type="button"
                              className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                              onClick={() => handleDelete(row)}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{" "}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
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
              <button type="button" className="btn btn-sm btn-primary-600">
                {currentPage}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        onClose={() => setIsFilterSidebarOpen(false)}
        title="Find Email Setting"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select School--</option>
              {schoolOptions.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">
              Email Protocol
            </label>
            <select
              id="emailProtocol"
              className="form-control form-select"
              value={pendingFilters.emailProtocol}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">--Select --</option>
              {protocolOptions.map((protocol) => (
                <option key={protocol} value={protocol}>
                  {protocol}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-10">
            <button type="submit" className="btn btn-primary-600 flex-fill">
              Apply Filter
            </button>
            <button
              type="button"
              className="btn btn-light border flex-fill"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default EmailSetting;
