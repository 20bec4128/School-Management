import React, { useMemo, useState } from 'react';
import SlideSidebar from '../components/SlideSidebar';
import ExportDropdown from '../components/ExportDropdown';
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
          <ExportDropdown
            rows={filteredData}
            columns={columnOptions}
            fileName="asset-return-report"
            sheetName="Asset Returns"
            pdfTitle="Asset Return Report"
          />
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
