import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import SlideSidebar from "../components/SlideSidebar";
import useColumnVisibility from "../hooks/useColumnVisibility";
import "../assets/css/addModalShared.css";

const emptyFilters = {
  schoolId: "Select",
  classId: "Select",
  hostelId: "Select",
};

const columnOptions = [
  { key: "school", label: "School" },
  { key: "photo", label: "Photo" },
  { key: "name", label: "Name" },
  { key: "className", label: "Class" },
  { key: "section", label: "Section" },
  { key: "rollNo", label: "Roll No" },
  { key: "hostel", label: "Hostel" },
  { key: "roomNo", label: "Room No" },
  { key: "costPerSeat", label: "Cost per Seat" },
];

const HostelMember = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  
  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch =
        !q ||
        row.name?.toLowerCase().includes(q) ||
        row.rollNo?.toString().includes(q) ||
        row.hostel?.toLowerCase().includes(q);
      const matchesSchool =
        filters.schoolId === "Select" || row.schoolId === filters.schoolId;
      return matchesSearch && matchesSchool;
    });
  }, [data, search, filters]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [currentPage, filteredData, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HostelMembers");
    XLSX.writeFile(wb, "Hostel_Member_List.xlsx");
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Hostel Member</h1>
          <span className="text-secondary-light">Hostel / Hostel Member</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span><i className="ri-arrow-down-s-line"></i></span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 d-flex align-items-center gap-10"
                      onClick={handleExportExcel}
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>

              <button className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="position-relative">
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
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map(
                    (col) =>
                      visibleColumns[col.key] && (
                        <th key={col.key}>{col.label}</th>
                      ),
                  )}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      {columnOptions.map(
                        (col) =>
                          visibleColumns[col.key] && (
                            <td key={col.key}>
                              {col.key === "photo" ? (
                                <img
                                  src={row.photo || "https://via.placeholder.com/40"}
                                  alt="member"
                                  className="w-40-px h-40-px radius-circle"
                                />
                              ) : col.key === "name" ? (
                                <span className="fw-medium text-primary-light">
                                  {row[col.key]}
                                </span>
                              ) : (
                                row[col.key]
                              )}
                            </td>
                          ),
                      )}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0">
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
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{" "}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
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
                  className={p === currentPage ? "btn btn-sm btn-primary-600" : "btn btn-sm btn-light border"}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
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
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Find Hostel Member"
      >
        <form className="p-20 d-grid gap-16">
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
            <select className="form-control form-select">
              <option value="Select">--Select School--</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Class</label>
            <select className="form-control form-select">
              <option value="Select">--Select Class--</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Hostel</label>
            <select className="form-control form-select">
              <option value="Select">--Select Hostel--</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary-600 w-100">Apply Filter</button>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default HostelMember;
