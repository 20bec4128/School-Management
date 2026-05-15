import { useMemo, useState } from 'react';
import SlideSidebar from '../components/SlideSidebar';
import useColumnVisibility from '../hooks/useColumnVisibility';
import '../assets/css/addModalShared.css';
import ExportDropdown from '../components/ExportDropdown'

const emptyFilters = {
  school: 'Select',
  className: 'Select',
  month: 'Select',
  status: 'Select',
};

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'student', label: 'Student' },
  { key: 'className', label: 'Class' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
];

const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const sanitizeCell = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replaceAll('"', '""');
};

const getExportColumns = (visibleColumns) =>
  columnOptions.filter((column) => visibleColumns[column.key]);

const PaidReceipt = () => {
  const [data, setData] = useState([]); 
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch = !q || Object.values(row).some((v) => String(v).toLowerCase().includes(q));
      const matchesSchool = filters.school === 'Select' || row.school === filters.school;
      const matchesClass = filters.className === 'Select' || row.className === filters.className;
      const matchesMonth = filters.month === 'Select' || row.month === filters.month;
      const matchesStatus = filters.status === 'Select' || row.status === filters.status;
      return matchesSearch && matchesSchool && matchesClass && matchesMonth && matchesStatus;
    });
  }, [data, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [currentPage, filtered, rowsPerPage]);

  const exportData = useMemo(
    () => filtered.map((row) => {
      const record = {};
      getExportColumns(visibleColumns).forEach((column) => {
        record[column.label] = row?.[column.key] ?? "";
      });
      return record;
    }),
    [filtered, visibleColumns],
  );

  const handleExportCSV = () => {
    const cols = getExportColumns(visibleColumns);
    if (cols.length === 0) return;
    const header = cols.map((col) => `"${sanitizeCell(col.label)}"`).join(",");
    const rows = exportData.map((record) =>
      cols.map((col) => `"${sanitizeCell(record[col.label])}"`).join(","),
    );
    downloadTextFile("paid-receipts.csv", [header, ...rows].join("\n"), "text/csv;charset=utf-8");
  };

  const handleExportXLS = async () => {
    const cols = getExportColumns(visibleColumns);
    if (cols.length === 0) return;
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Receipts");
    XLSX.writeFile(workbook, "paid-receipts.xlsx");
  };

  const handleExportPDF = async () => {
    const cols = getExportColumns(visibleColumns);
    if (cols.length === 0) return;
    const [{ default: jsPDF }, autoTable] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Paid Receipts Report", 14, 14);
    autoTable.default(doc, {
      startY: 20,
      head: [cols.map((col) => col.label)],
      body: exportData.map((record) => cols.map((col) => String(record[col.label] ?? ""))),
      headStyles: { fillColor: [31, 41, 55] },
    });
    doc.save("paid-receipts.pdf");
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setFilters(pendingFilters);
    setIsFilterSidebarOpen(false);
    setCurrentPage(1);
  };

  const renderCell = (row, column) => {
    const value = row[column.key];
    if (column.key === 'status') {
      return (
        <span className="px-12 py-4 radius-4 fw-medium text-sm bg-success-100 text-success-600">
          {value || 'Paid'}
        </span>
      );
    }
    if (column.key === 'invoiceNumber') {
      return <span className="fw-medium text-primary-light">{value || '--'}</span>;
    }
    return value || '--';
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Paid Receipt</h1>
          <span className="text-secondary-light">Dashboard / Paid Receipt</span>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              
              <ExportDropdown
                rows={filtered}
                columns={columnOptions}
                visibleColumns={visibleColumns}
                fileName="paid-receipts"
                sheetName="Receipts"
                pdfTitle="Paid Receipts Report"
                onExportExcel={handleExportCSV}
                onExportPDF={handleExportPDF}
              />

              <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" onClick={() => setIsFilterSidebarOpen(true)}>
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">Filter</span>
                <span><i className="ri-arrow-right-line"></i></span>
              </button>

              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
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

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search receipts..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th scope="col" key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && <td key={col.key}>{renderCell(row, col)}</td>)}
                      <td>
                        <button type="button" className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle">
                          <i className="ri-printer-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} –{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 2), currentPage + 1)
                .map((p) => (
                  <button key={p} type="button" className={p === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
              <button type="button" className="btn btn-sm btn-light border" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} title="Filter Receipts" onClose={() => setIsFilterSidebarOpen(false)}>
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">School</label>
            <select className="form-control form-select" value={pendingFilters.school} onChange={(e) => setPendingFilters(p => ({ ...p, school: e.target.value }))}>
              <option value="Select">All Schools</option>
              <option>Windsor Park High School</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">Class</label>
            <select className="form-control form-select" value={pendingFilters.className} onChange={(e) => setPendingFilters(p => ({ ...p, className: e.target.value }))}>
              <option value="Select">All Classes</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">Month</label>
            <select className="form-control form-select" value={pendingFilters.month} onChange={(e) => setPendingFilters(p => ({ ...p, month: e.target.value }))}>
              <option value="Select">All Months</option>
              <option>January</option>
              <option>February</option>
              <option>March</option>
              <option>April</option>
              <option>May</option>
              <option>June</option>
              <option>July</option>
              <option>August</option>
              <option>September</option>
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8 d-inline-block">Status</label>
            <select className="form-control form-select" value={pendingFilters.status} onChange={(e) => setPendingFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="Select">All Status</option>
              <option>Paid</option>
              <option>Partially Paid</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={() => setPendingFilters(emptyFilters)}>Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply Filters</button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  );
};

export default PaidReceipt;
