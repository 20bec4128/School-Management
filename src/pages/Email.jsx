import { useEffect, useMemo, useState } from "react";
import SlideSidebar from "../components/SlideSidebar";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import useColumnVisibility from "../hooks/useColumnVisibility";
import ExportDropdown from "../components/ExportDropdown";
import "../assets/css/addModalShared.css";
import { useAuth } from "../context/useAuth";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { normalizeRole } from "../utils/roles";
import {
  deleteEmail,
  fetchEmailsPage,
} from "../apis/emailApi";
import { EMAIL_EDIT_STORAGE_KEY } from "../constants/email";

const emptyFilters = {
  headOfficeId: "Select",
  school: "Select",
  receiverType: "Select",
};

const columnOptions = [
  { key: "schoolName", label: "School" },
  { key: "className", label: "Class" },
  { key: "receiverType", label: "Receiver Type" },
  { key: "receiver", label: "Receiver" },
  { key: "subject", label: "Subject" },
  { key: "sendDate", label: "Send Date" },
];

const uniqueStrings = (items) =>
  Array.from(new Set((items || []).map((i) => String(i ?? "").trim()).filter(Boolean))).sort();

const Email = ({ onNavigate }) => {
  const { role: authRole, user, schoolId, headOfficeId } = useAuth();
  const isSuperAdmin = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority) === "SUPER_ADMIN",
    [authRole, user],
  );
  const [rows, setRows] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchEmailsPage({
        headOfficeId,
        schoolId,
        page: currentPage - 1,
        size: rowsPerPage,
        search,
      });
      setRows(data?.content || []);
    } catch (err) {
      setError(err?.message || "Failed to fetch email dispatch logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, rowsPerPage, search, schoolId, headOfficeId]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [hoList, schoolList] = await Promise.all([
          fetchHeadOfficesLookup(),
          fetchSchoolsLookup(),
        ]);
        setHeadOffices(Array.isArray(hoList) ? hoList : []);
        setSchools(Array.isArray(schoolList) ? schoolList : []);
      } catch {
        setHeadOffices([]);
        setSchools([]);
      }
    };

    void loadLookups();
  }, []);

  const schoolOptions = useMemo(() => {
    const filtered = Array.isArray(schools)
      ? schools.filter(
          (school) =>
            !isSuperAdmin ||
            pendingFilters.headOfficeId === "Select" ||
            String(school.headOfficeId ?? "") === String(pendingFilters.headOfficeId),
        )
      : [];

    return filtered.sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)));
  }, [schools, pendingFilters.headOfficeId, isSuperAdmin]);
  const receiverTypeOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.receiverType)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [row.schoolName, row.className, row.receiverType, row.receiver, row.subject, row.sendDate]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesHeadOffice =
        !isSuperAdmin ||
        filters.headOfficeId === "Select" ||
        String(row.headOfficeId ?? "") === String(filters.headOfficeId);
      const matchesSchool = filters.school === "Select" || row.schoolName === filters.school;
      const matchesReceiverType =
        filters.receiverType === "Select" || row.receiverType === filters.receiverType;
      return matchesSearch && matchesHeadOffice && matchesSchool && matchesReceiverType;
    });
  }, [rows, search, filters, isSuperAdmin]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginatedRows.map((row) => row.id)])]);
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginatedRows.some((row) => row.id === id)));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target;
    setPendingFilters((prev) => {
      if (id === "headOfficeId") {
        return {
          ...prev,
          headOfficeId: value,
          school: "Select",
        };
      }
      return { ...prev, [id]: value };
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setFilters(pendingFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
  };

  const openAdd = () => {
    sessionStorage.removeItem(EMAIL_EDIT_STORAGE_KEY);
    onNavigate?.("email-create");
  };

  const openEdit = (row) => {
    sessionStorage.setItem(EMAIL_EDIT_STORAGE_KEY, String(row.id));
    onNavigate?.("email-create");
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this email record?")) return;
    try {
      await deleteEmail(row.id);
      setSelectedRows((prev) => prev.filter((id) => id !== row.id));
      await loadData();
    } catch (err) {
      alert(err?.message || "Failed to remove entry record item.");
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Email</h1>
          <span className="text-secondary-light">Communications / Email</span>
        </div>
        <button type="button" className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-send-plane-2-line"></i> Send Email
        </button>
      </div>

      {error ? <div className="alert alert-danger radius-8">{error}</div> : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />
              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Columns</span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[column.key]} onChange={() => toggleColumn(column.key)} />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
              />
            </div>
            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light"><i className="ri-search-line"></i></span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={paginatedRows.length > 0 && paginatedRows.every((row) => selectedRows.includes(row.id))} onChange={handleSelectAll} />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40">Loading records...</td></tr>
                ) : paginatedRows.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" checked={selectedRows.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                          <label className="form-check-label">{String((currentPage - 1) * rowsPerPage + idx + 1).padStart(2, "0")}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>{row[col.key] || "-"}</td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Edit" onClick={() => openEdit(row)}>
                            <i className="ri-edit-line"></i>
                          </button>
                          <button type="button" className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle" title="Delete" onClick={() => handleDelete(row)}>
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
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {getVisiblePages().map((p) => (
                <button key={p} type="button" className={p === currentPage ? "btn btn-sm btn-primary-600" : "btn btn-sm btn-light border"} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterOpen} title="Filter Email" onClose={() => setIsFilterOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">Head Office</label>
              <select
                id="headOfficeId"
                className="form-control form-select"
                value={pendingFilters.headOfficeId}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">--Select Head Office--</option>
                {headOffices.map((option) => (
                  <option key={String(option.id)} value={String(option.id)}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
              disabled={isSuperAdmin && pendingFilters.headOfficeId === "Select" && headOffices.length > 0}
            >
              <option value="Select">
                {pendingFilters.headOfficeId === "Select"
                  ? "--Select School--"
                  : "--Select School--"}
              </option>
              {schoolOptions.map((option) => (
                <option key={String(option.id)} value={option.schoolName}>
                  {option.schoolName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Receiver Type</label>
            <select id="receiverType" className="form-control form-select" value={pendingFilters.receiverType} onChange={handlePendingFilterChange}>
              <option value="Select">--Select Receiver Type--</option>
              {receiverTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">Reset</button>
          <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default Email;
