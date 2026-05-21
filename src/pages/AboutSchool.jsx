import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import SlideSidebar from "../components/SlideSidebar";
import ExportDropdown from "../components/ExportDropdown";
import RowsPerPageSelect from "../components/RowsPerPageSelect";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import useColumnVisibility from "../hooks/useColumnVisibility";
import { TablePagination } from "../components/table";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchAboutSchools } from "../apis/aboutSchoolsApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import "../assets/css/addModalShared.css";

const columnOptions = [
  { key: "schoolName", label: "School" },
  { key: "aboutText", label: "About School" },
  { key: "image", label: "Image" },
];

const resolveImageSrc = (value) => {
  const src = String(value || "").trim();
  if (!src) return "https://via.placeholder.com/80x48";
  if (src.startsWith("data:") || src.startsWith("http")) return src;
  return src;
};

const AboutSchool = ({ onNavigate }) => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId } = useAuth();
  const normalizedRole = normalizeRole(role);
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
  const isHeadOfficeAdmin = normalizedRole === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = normalizedRole === "SCHOOL_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

  const [allSchools, setAllSchools] = useState([]);
  const [aboutRows, setAboutRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isScopeOpen, setIsScopeOpen] = useState(false);

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  useEffect(() => {
    let cancelled = false;
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup();
        if (!cancelled) setAllSchools(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setAllSchools([]);
      }
    };
    void loadSchools();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedHeadOfficeId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : "";
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : "";
    if (isSchoolAdmin) {
      const school = allSchools.find((item) => String(item.id) === String(authSchoolId ?? ""));
      return school?.headOfficeId != null ? String(school.headOfficeId) : "";
    }
    return "";
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId]);

  const selectedSchoolId = useMemo(() => {
    if (isSuperAdmin) return manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : "";
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : "";
    return "";
  }, [authSchoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId]);

  const scopedSchools = useMemo(() => {
    let rows = Array.isArray(allSchools) ? allSchools : [];
    if (isSuperAdmin) {
      if (manualScope.selectedHeadOfficeId) {
        rows = rows.filter((school) => String(school?.headOfficeId ?? "") === String(manualScope.selectedHeadOfficeId));
      }
      if (manualScope.selectedSchoolId) {
        rows = rows.filter((school) => String(school?.id ?? "") === String(manualScope.selectedSchoolId));
      }
      return rows;
    }
    if (isHeadOfficeAdmin) {
      return rows.filter((school) => String(school?.headOfficeId ?? "") === String(authHeadOfficeId ?? ""));
    }
    if (isSchoolAdmin) {
      return rows.filter((school) => String(school?.id ?? "") === String(authSchoolId ?? ""));
    }
    return rows;
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.selectedSchoolId]);

  useEffect(() => {
    let cancelled = false;
    const loadAboutRows = async () => {
      setLoading(true);
      try {
        const rows = await fetchAboutSchools({
          headOfficeId: selectedHeadOfficeId || undefined,
          schoolId: selectedSchoolId || undefined,
        });
        if (!cancelled) setAboutRows(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setAboutRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadAboutRows();
    return () => {
      cancelled = true;
    };
  }, [selectedHeadOfficeId, selectedSchoolId]);

  const mergedRows = useMemo(() => {
    const aboutBySchoolId = new Map();
    for (const row of aboutRows) {
      if (row?.schoolId != null) {
        aboutBySchoolId.set(String(row.schoolId), row);
      }
    }

    return scopedSchools.map((school) => {
      const about = aboutBySchoolId.get(String(school.id));
      return {
        schoolId: school.id,
        schoolName: school.schoolName,
        headOfficeId: school.headOfficeId ?? null,
        aboutId: about?.id ?? null,
        aboutText: about?.aboutText ?? "",
        image: about?.image ?? "",
      };
    });
  }, [aboutRows, scopedSchools]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mergedRows;
    return mergedRows.filter((row) => {
      return (
        String(row.schoolName || "").toLowerCase().includes(q) ||
        String(row.aboutText || "").toLowerCase().includes(q)
      );
    });
  }, [mergedRows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [currentPage, filteredRows, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredRows.map((row, index) => ({
        SL: index + 1,
        School: row.schoolName,
        "About School": row.aboutText,
        Image: row.image ? "Has Image" : "No Image",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AboutSchool");
    XLSX.writeFile(wb, "About_School_List.xlsx");
  };

  const handleEdit = (row) => {
    try {
      sessionStorage.setItem("edit-about-school-row", JSON.stringify(row));
    } catch {
      // Ignore storage failures.
    }
    onNavigate?.("about-school-edit");
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
              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsScopeOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line" />
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(Number(next));
                  setCurrentPage(1);
                }}
              />
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
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key} scope="col">{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading school data...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.schoolId}>
                      <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      {visibleColumns.schoolName ? (
                        <td className="fw-medium text-primary-light">{row.schoolName}</td>
                      ) : null}
                      {visibleColumns.aboutText ? (
                        <td style={{ maxWidth: 420, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                          {row.aboutText || <span className="text-secondary-light">No about text yet</span>}
                        </td>
                      ) : null}
                      {visibleColumns.image ? (
                        <td>
                          <img
                            src={resolveImageSrc(row.image)}
                            alt={row.schoolName}
                            className="w-80-px h-48-px radius-4 object-fit-cover"
                          />
                        </td>
                      ) : null}
                      <td>
                        <button
                          type="button"
                          className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                          title={row.aboutId ? "Edit About School" : "Add About School"}
                          onClick={() => handleEdit(row)}
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filteredRows.length)} of ${filteredRows.length} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isScopeOpen} onClose={() => setIsScopeOpen(false)} title="Scope">
        <form
          className="p-20 d-grid gap-16"
          onSubmit={(e) => {
            e.preventDefault();
            setIsScopeOpen(false);
            setCurrentPage(1);
          }}
        >
          <ManualScopeSelectors
            enabled={isSuperAdmin}
            headOffices={manualScope.headOffices}
            schoolOptions={manualScope.schoolOptions}
            selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
            onHeadOfficeChange={(value) => {
              manualScope.setSelectedScope(value, "");
              setCurrentPage(1);
            }}
            selectedSchoolId={manualScope.selectedSchoolId}
            onSchoolChange={(value) => {
              manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value);
              setCurrentPage(1);
            }}
            showSchoolSelector
          />
          <button type="submit" className="btn btn-primary-600 w-100">Apply Scope</button>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default AboutSchool;
