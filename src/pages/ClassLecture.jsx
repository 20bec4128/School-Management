import { useCallback, useEffect, useMemo, useState } from "react";
import useColumnVisibility from "../hooks/useColumnVisibility";
import {
  deleteClassLecture,
  fetchClassLectures,
} from "../apis/classLectureApi";
import "../assets/css/addModalShared.css";
import ExportDropdown from "../components/ExportDropdown";

const EDIT_STORAGE_KEY = "edit-class-lecture-row";

const columnOptions = [
  { key: "school", label: "School" },
  { key: "title", label: "Title" },
  { key: "class", label: "Class" },
  { key: "section", label: "Section" },
  { key: "subject", label: "Subject" },
  { key: "teacher", label: "Teacher" },
  { key: "classLecture", label: "Class Lecture" },
  { key: "academicYear", label: "Academic Year" },
];

const ClassLecture = ({ onNavigate }) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  const [filters, setFilters] = useState({
    class: "All",
    subject: "All",
    lectureType: "All",
  });

  const [pendingFilters, setPendingFilters] = useState({
    class: "All",
    subject: "All",
    lectureType: "All",
  });

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};

  const loadLectures = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchClassLectures();
      setLectures(Array.isArray(data) ? data : []);
    } catch (e) {
      setLectures([]);
      setError(e?.message || "Failed to load class lectures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLectures();
  }, [loadLectures]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return lectures.filter((row) => {
      const matchesSearch =
        !q ||
        [
          row?.school,
          row?.title,
          row?.class,
          row?.section,
          row?.subject,
          row?.teacher,
          row?.classLecture,
          row?.academicYear,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesClass =
        filters.class === "All" || row?.class === filters.class;

      const matchesSubject =
        filters.subject === "All" || row?.subject === filters.subject;

      const matchesLectureType =
        filters.lectureType === "All" ||
        row?.classLecture === filters.lectureType;

      return (
        matchesSearch && matchesClass && matchesSubject && matchesLectureType
      );
    });
  }, [lectures, filters, search]);

  const classOptions = useMemo(
    () =>
      Array.from(new Set(lectures.map((item) => item?.class).filter(Boolean))),
    [lectures],
  );

  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(lectures.map((item) => item?.subject).filter(Boolean)),
      ),
    [lectures],
  );

  const lectureTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(lectures.map((item) => item?.classLecture).filter(Boolean)),
      ),
    [lectures],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [currentPage, filtered, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const allSelected =
    paginated.length > 0 &&
    paginated.every((row) => selectedRows.includes(row.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [
        ...new Set([...prev, ...paginated.map((row) => row.id)]),
      ]);
    } else {
      setSelectedRows((prev) =>
        prev.filter((id) => !paginated.some((row) => row.id === id)),
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
    navigateTo("add-class-lecture");
  };

  const openEdit = (row) => {
    sessionStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(row));
    navigateTo("add-class-lecture");
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!lectureId) return;

    const confirmed = window.confirm(
      "Delete this class lecture? This cannot be undone.",
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await deleteClassLecture(lectureId);

      setLectures((prev) => prev.filter((lecture) => lecture.id !== lectureId));
      setSelectedRows((prev) => prev.filter((id) => id !== lectureId));
    } catch (e) {
      setError(e?.message || "Failed to delete class lecture");
    } finally {
      setSaving(false);
    }
  };

  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  const lectureTypeBadge = (type) => {
    const map = {
      Youtube: "bg-danger-100 text-danger-600",
      Vimeo: "bg-info-100 text-info-600",
      "Power Point": "bg-warning-100 text-warning-600",
    };

    return map[type] || "bg-neutral-100 text-secondary-light";
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Class Lecture
          </h1>

          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>

            <span className="text-secondary-light"> / Class Lecture</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-12">
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={openAdd}
          >
            <span className="d-flex text-md">
              <i className="ri-add-large-line"></i>
            </span>
            Add Class Lecture
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-24">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
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

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Filter
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>

                <div
                  className="dropdown-menu p-12 border bg-base shadow"
                  style={{ minWidth: 280 }}
                >
                  <div className="mb-10">
                    <label
                      htmlFor="filterClass"
                      className="text-sm fw-semibold text-primary-light d-inline-block mb-6"
                    >
                      Class
                    </label>

                    <select
                      id="filterClass"
                      className="form-control form-select"
                      value={pendingFilters.class}
                      onChange={(e) =>
                        setPendingFilters((prev) => ({
                          ...prev,
                          class: e.target.value,
                        }))
                      }
                    >
                      <option value="All">All</option>
                      {classOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-10">
                    <label
                      htmlFor="filterSubject"
                      className="text-sm fw-semibold text-primary-light d-inline-block mb-6"
                    >
                      Subject
                    </label>

                    <select
                      id="filterSubject"
                      className="form-control form-select"
                      value={pendingFilters.subject}
                      onChange={(e) =>
                        setPendingFilters((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                    >
                      <option value="All">All</option>
                      {subjectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-12">
                    <label
                      htmlFor="filterLectureType"
                      className="text-sm fw-semibold text-primary-light d-inline-block mb-6"
                    >
                      Lecture Type
                    </label>

                    <select
                      id="filterLectureType"
                      className="form-control form-select"
                      value={pendingFilters.lectureType}
                      onChange={(e) =>
                        setPendingFilters((prev) => ({
                          ...prev,
                          lectureType: e.target.value,
                        }))
                      }
                    >
                      <option value="All">All</option>
                      {lectureTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex gap-8">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border w-100"
                      onClick={() => {
                        const reset = {
                          class: "All",
                          subject: "All",
                          lectureType: "All",
                        };

                        setPendingFilters(reset);
                        setFilters(reset);
                        setCurrentPage(1);
                      }}
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-primary-600 w-100"
                      onClick={() => {
                        setFilters(pendingFilters);
                        setCurrentPage(1);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 20, 50].map((number) => (
                  <option key={number} value={number}>
                    {number}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search lecture..."
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
                        className="form-check-input"
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>

                  {visibleColumns.school && <th scope="col">School</th>}
                  {visibleColumns.title && <th scope="col">Title</th>}
                  {visibleColumns.class && <th scope="col">Class</th>}
                  {visibleColumns.section && <th scope="col">Section</th>}
                  {visibleColumns.subject && <th scope="col">Subject</th>}
                  {visibleColumns.teacher && <th scope="col">Teacher</th>}
                  {visibleColumns.classLecture && (
                    <th scope="col">Class Lecture</th>
                  )}
                  {visibleColumns.academicYear && (
                    <th scope="col">Academic Year</th>
                  )}

                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      Loading class lectures...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 2}
                      className="text-center py-40 text-secondary-light"
                    >
                      No class lectures found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, index) => (
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
                            {(currentPage - 1) * rowsPerPage + index + 1}
                          </label>
                        </div>
                      </td>

                      {visibleColumns.school && <td>{row.school}</td>}
                      {visibleColumns.title && <td>{row.title}</td>}
                      {visibleColumns.class && <td>{row.class}</td>}
                      {visibleColumns.section && (
                        <td className="text-center">{row.section}</td>
                      )}
                      {visibleColumns.subject && <td>{row.subject}</td>}
                      {visibleColumns.teacher && (
                        <td className="fw-medium text-primary-light">
                          {row.teacher}
                        </td>
                      )}

                      {visibleColumns.classLecture && (
                        <td>
                          {row.lectureUrl ? (
                            <a
                              href={row.lectureUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: "none" }}
                            >
                              <span
                                className={`px-12 py-4 radius-4 fw-medium text-sm ${lectureTypeBadge(
                                  row.classLecture,
                                )}`}
                              >
                                {row.classLecture}
                              </span>
                            </a>
                          ) : (
                            <span
                              className={`px-12 py-4 radius-4 fw-medium text-sm ${lectureTypeBadge(
                                row.classLecture,
                              )}`}
                            >
                              {row.classLecture}
                            </span>
                          )}
                        </td>
                      )}

                      {visibleColumns.academicYear && (
                        <td>{row.academicYear}</td>
                      )}

                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>

                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            onClick={() => handleDeleteLecture(row.id)}
                            title="Delete"
                            disabled={saving}
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
              {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}{" "}
              - {Math.min(currentPage * rowsPerPage, filtered.length)} of{" "}
              {filtered.length}
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
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassLecture;
