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
  fetchResultEmailsPage,
  deleteResultEmail,
} from "../apis/resultEmailApi";

const emptyFilters = {
  headOfficeId: "Select",
  school: "Select",
  exam: "Select",
  receiverType: "Select",
  subject: "Select",
};

const columnOptions = [
  { key: "schoolName", label: "School" },
  { key: "examTerm", label: "Exam Term" },
  { key: "receiverType", label: "Receiver Type" },
  { key: "receiver", label: "Receiver" },
  { key: "subject", label: "Subject" },
  { key: "sendDate", label: "Send Date" },
];

const uniqueStrings = (items) =>
  Array.from(
    new Set((items || []).map((i) => String(i ?? "").trim()).filter(Boolean)),
  ).sort();

const ResultEmail = ({ onNavigate }) => {
  const { role: authRole, user, schoolId, headOfficeId } = useAuth();
  const isSuperAdmin = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority) === "SUPER_ADMIN",
    [authRole, user],
  );
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  const [rows, setRows] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);
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
      const data = await fetchResultEmailsPage({
        headOfficeId,
        schoolId,
        page: currentPage - 1,
        size: rowsPerPage,
        search: search,
      });
      setRows(data?.content || []);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      setError(err?.message || "Failed to fetch result email dispatch logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, rowsPerPage, search, schoolId, headOfficeId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchHeadOfficesLookup(), fetchSchoolsLookup()])
      .then(([hoList, schoolList]) => {
        if (cancelled) return;
        setHeadOffices(Array.isArray(hoList) ? hoList : []);
        setSchools(Array.isArray(schoolList) ? schoolList : []);
      })
      .catch(() => {
        if (!cancelled) {
          setHeadOffices([]);
          setSchools([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const schoolOptions = useMemo(
    () =>
      Array.isArray(schools)
        ? schools
            .map((school) => ({
              id: school?.id != null ? String(school.id) : "",
              schoolName: school?.schoolName || "",
              headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : "",
            }))
            .filter((school) => {
              if (!school.id || !school.schoolName) return false;
              if (!isSuperAdmin || pendingFilters.headOfficeId === "Select") return true;
              return school.headOfficeId === String(pendingFilters.headOfficeId);
            })
            .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)))
        : [],
    [schools, isSuperAdmin, pendingFilters.headOfficeId],
  );
  const headOfficeOptions = useMemo(
    () =>
      Array.isArray(headOffices)
        ? headOffices
            .map((headOffice) => ({
              id: headOffice?.id != null ? String(headOffice.id) : "",
              name: headOffice?.name || "",
            }))
            .filter((headOffice) => headOffice.id && headOffice.name)
            .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        : [],
    [headOffices],
  );
  const examOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.examTerm)),
    [rows],
  );
  const receiverTypeOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.receiverType)),
    [rows],
  );
  const subjectOptions = useMemo(
    () => uniqueStrings(rows.map((item) => item.subject)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        isSuperAdmin &&
        filters.headOfficeId !== "Select" &&
        String(row.headOfficeId ?? "") !== String(filters.headOfficeId)
      ) {
        return false;
      }
      if (filters.school !== "Select" && row.schoolName !== filters.school)
        return false;
      if (filters.exam !== "Select" && row.examTerm !== filters.exam)
        return false;
      if (
        filters.receiverType !== "Select" &&
        row.receiverType !== filters.receiverType
      )
        return false;
      if (filters.subject !== "Select" && row.subject !== filters.subject)
        return false;
      return true;
    });
  }, [rows, filters, isSuperAdmin]);

  const totalPages = Math.max(1, Math.ceil(totalElements / rowsPerPage));

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
        prev.filter((id) => !filteredRows.some((row) => row.id === id)),
      );
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
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
    setIsFilterSidebarOpen(false);
  };

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
  };

  const openAdd = () => {
    sessionStorage.removeItem("RESULT_EMAIL_EDIT_ID");
    onNavigate?.("result-email-create");
  };

  const openEdit = (row) => {
    sessionStorage.setItem("RESULT_EMAIL_EDIT_ID", String(row.id));
    onNavigate?.("result-email-create");
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this result email history record?",
      )
    )
      return;
    try {
      await deleteResultEmail(row.id);
      setSelectedRows((prev) => prev.filter((id) => id !== row.id));
      loadData();
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Result Email
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Result Email</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-mail-send-line"></i>
          </span>
          Send Email
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
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search result email..."
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
              style={{ minWidth: 1000 }}
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
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.examTerm ? <th scope="col">Exam Term</th> : null}
                  {visibleColumns.receiverType ? <th scope="col">Receiver Type</th> : null}
                  {visibleColumns.receiver ? <th scope="col">Receiver</th> : null}
                  {visibleColumns.subject ? <th scope="col">Subject</th> : null}
                  {visibleColumns.sendDate ? <th scope="col">Send Date</th> : null}
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
                      Loading records...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No result email records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {String(
                              idx + 1 + (currentPage - 1) * rowsPerPage,
                            ).padStart(2, "0")}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? (
                        <td className="fw-medium text-primary-light">
                          {row.schoolName}
                        </td>
                      ) : null}
                      {visibleColumns.examTerm ? <td>{row.examTerm}</td> : null}
                      {visibleColumns.receiverType ? <td>{row.receiverType}</td> : null}
                      {visibleColumns.receiver ? <td>{row.receiver}</td> : null}
                      {visibleColumns.subject ? <td className="fw-medium">{row.subject}</td> : null}
                      {visibleColumns.sendDate ? <td>{row.sendDate}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Delete"
                            onClick={() => handleDelete(row)}
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
        title="Filter Result Email"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form
          className="p-20 d-grid grid-cols-2 gap-16"
          onSubmit={handleApplyFilters}
        >
          {isSuperAdmin ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                htmlFor="headOfficeId"
                className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
              >
                Head Office
              </label>
              <select
                id="headOfficeId"
                className="form-control form-select"
                value={pendingFilters.headOfficeId}
                onChange={handlePendingFilterChange}
              >
                <option value="Select">Select Head Office</option>
                {headOfficeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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
              disabled={isSuperAdmin && pendingFilters.headOfficeId === "Select"}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => (
                <option key={option.id} value={option.schoolName}>
                  {option.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="exam"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Exam
            </label>
            <select
              id="exam"
              className="form-control form-select"
              value={pendingFilters.exam}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Exam</option>
              {examOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="receiverType"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Receiver Type
            </label>
            <select
              id="receiverType"
              className="form-control form-select"
              value={pendingFilters.receiverType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Receiver Type</option>
              {receiverTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label
              htmlFor="subject"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Subject
            </label>
            <select
              id="subject"
              className="form-control form-select"
              value={pendingFilters.subject}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Subject</option>
              {subjectOptions.map((option) => (
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

export default ResultEmail;
