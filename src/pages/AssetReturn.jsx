import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SlideSidebar from '../components/SlideSidebar';
import useColumnVisibility from '../hooks/useColumnVisibility';

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'asset', label: 'Asset' },
  { key: 'returnedBy', label: 'Returned By' },
  { key: 'returnDate', label: 'Return Date' },
];

const seedData = [
  { id: 1, school: 'Green Valley School', vendor: 'Alpha Supplies', asset: 'Projector', returnedBy: 'John Carter', returnDate: '2026-05-01' },
  { id: 2, school: 'Sunrise Academy', vendor: 'Prime Assets', asset: 'Laptop', returnedBy: 'Maya Singh', returnDate: '2026-05-07' },
];

const AssetReturn = () => {
  const [search, setSearch] = useState('');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [data] = useState(seedData);
  const { visibleColumns, visibleColumnCount } = useColumnVisibility(columnOptions);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => !q || Object.values(row).some((value) => String(value).toLowerCase().includes(q)));
  }, [data, search]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asset Returns');
    XLSX.writeFile(workbook, 'asset-return-report.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('Asset Return Report', 14, 10);
    doc.autoTable({
      head: [['School', 'Vendor', 'Asset', 'Returned By', 'Return Date']],
      body: filteredData.map((row) => [row.school, row.vendor, row.asset, row.returnedBy, row.returnDate]),
    });
    doc.save('asset-return-report.pdf');
  };

  return (
    <div className="avm-page">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="fw-semibold mb-2 h6 text-primary-light">Asset Return</h1>
          <span className="text-secondary-light">Asset / Return Management</span>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <input
            className="avm-input"
            style={{ minWidth: 220 }}
            placeholder="Search returns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={() => setIsFilterSidebarOpen(true)}>Filters</button>
          <button className="btn btn-outline-secondary" onClick={handleExportExcel}>Excel</button>
          <button className="btn btn-outline-secondary" onClick={handleExportPDF}>PDF</button>
        </div>
      </div>

      <div className="avm-table-responsive">
        <table className="avm-table">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length ? (
              filteredData.map((row) => (
                <tr key={row.id}>
                  {visibleColumns.map((col) => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumnCount} className="text-center py-4">
                  No return records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Asset Return">
        <div className="text-secondary-light">No extra filters are wired yet.</div>
      </SlideSidebar>
    </div>
  );
};

export default AssetReturn;
