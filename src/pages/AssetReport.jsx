import React, { useMemo, useState } from 'react';
import SlideSidebar from '../components/SlideSidebar';
import ExportDropdown from '../components/ExportDropdown';
import useColumnVisibility from '../hooks/useColumnVisibility';

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'asset', label: 'Asset' },
  { key: 'purchase', label: 'Purchase' },
  { key: 'issue', label: 'Issue' },
  { key: 'returnCount', label: 'Return' },
];

const seedData = [
  { id: 1, school: 'Green Valley School', asset: 'Projector', purchase: 12, issue: 8, returnCount: 4 },
  { id: 2, school: 'Sunrise Academy', asset: 'Laptop', purchase: 20, issue: 14, returnCount: 6 },
];

const AssetReport = () => {
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
          <h1 className="fw-semibold mb-2 h6 text-primary-light">Asset Report</h1>
          <span className="text-secondary-light">Asset / Reporting</span>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <input
            className="avm-input"
            style={{ minWidth: 220 }}
            placeholder="Search report"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={() => setIsFilterSidebarOpen(true)}>Filters</button>
          <ExportDropdown
            rows={filteredData}
            columns={columnOptions}
            fileName="asset-report"
            sheetName="Asset Report"
            pdfTitle="Asset Report"
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
                  No asset report data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} title="Find Asset Report">
        <div className="text-secondary-light">No extra filters are wired yet.</div>
      </SlideSidebar>
    </div>
  );
};

export default AssetReport;
