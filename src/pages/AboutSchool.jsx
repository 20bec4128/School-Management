import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import "../assets/css/addModalShared.css";
import ExportDropdown from '../components/ExportDropdown'

const aboutSchoolData = [
  {
    id: 1,
    school: "Windsor Park High School",
    aboutSchool:
      "Windsor Park High School is a modern campus focused on academic excellence, student wellbeing, and holistic growth.",
    image: "https://via.placeholder.com/80x48",
  },
  {
    id: 2,
    school: "Green Valley School",
    aboutSchool:
      "Green Valley School offers a balanced curriculum, active learning, and a supportive environment for every learner.",
    image: "https://via.placeholder.com/80x48",
  },
];

const AboutSchool = () => {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return aboutSchoolData.filter((row) => {
      if (!q) return true;
      return (
        row.school.toLowerCase().includes(q) ||
        row.aboutSchool.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [currentPage, filteredData, rowsPerPage]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((row, index) => ({
        SL: index + 1,
        School: row.school,
        "About School": row.aboutSchool,
        Image: row.image,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AboutSchool");
    XLSX.writeFile(wb, "About_School_List.xlsx");
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">About School</h1>
          <span className="text-secondary-light">Frontend / About School</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50].map((n) => (
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
                  <th scope="col">#SL</th>
                  <th scope="col">School</th>
                  <th scope="col">About School</th>
                  <th scope="col">Image</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-40 text-secondary-light"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      <td className="fw-medium text-primary-light">{row.school}</td>
                      <td style={{ maxWidth: 420 }}>{row.aboutSchool}</td>
                      <td>
                        <img
                          src={row.image}
                          alt={row.school}
                          className="w-80-px h-48-px radius-4 object-fit-cover"
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
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
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{" "}
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of{" "}
              {filteredData.length}
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
    </div>
  );
};

export default AboutSchool;
