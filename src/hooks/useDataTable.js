import { useState, useRef, useMemo, useCallback } from 'react';

export function useDataTable(data = [], columns = [], options = {}) {
  const {
    defaultRowsPerPage = 10,
    searchFields = [],
    exportFileName = 'export',
  } = options;

  // Internal state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [pendingFilters, setPendingFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(() => 
    columns.filter(col => col.visible !== false).map(col => col.field)
  );
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  
  const tableRef = useRef(null);

  // Reset to page 1 helper
  const resetToPage1 = useCallback((callback) => {
    setCurrentPage(1);
    if (callback) callback();
  }, []);

  // Global search handler
  const handleSearchChange = useCallback((value) => {
    setGlobalSearch(value);
    resetToPage1();
  }, [resetToPage1]);

  // Rows per page handler
  const handleRowsPerPageChange = useCallback((value) => {
    setRowsPerPage(Number(value));
    resetToPage1();
  }, [resetToPage1]);

  // Filter handlers
  const handlePendingFilterChange = useCallback((field, value) => {
    setPendingFilters(prev => ({
      ...prev,
      [field]: { value, matchMode: 'contains' }
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setFilters(pendingFilters);
    resetToPage1();
  }, [pendingFilters, resetToPage1]);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPendingFilters({});
    resetToPage1();
  }, [resetToPage1]);

  const handleRemoveFilter = useCallback((field) => {
    const newFilters = { ...filters };
    delete newFilters[field];
    setFilters(newFilters);
    
    const newPendingFilters = { ...pendingFilters };
    delete newPendingFilters[field];
    setPendingFilters(newPendingFilters);
  }, [filters, pendingFilters]);

  // Column toggle handler
  const handleToggleColumn = useCallback((field) => {
    setVisibleColumns(prev => {
      const isVisible = prev.includes(field);
      if (isVisible && prev.length === 1) return prev; // Can't hide last column
      if (isVisible) {
        return prev.filter(f => f !== field);
      }
      return [...prev, field];
    });
  }, []);

  // Page change handler
  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  // Toggle panel handlers
  const toggleFilterPanel = useCallback(() => {
    setFilterPanelOpen(prev => !prev);
  }, []);

  const toggleColumnPanel = useCallback(() => {
    setColumnPanelOpen(prev => !prev);
  }, []);

  // Computed: filtered data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Global search
    if (globalSearch && searchFields.length > 0) {
      const searchLower = globalSearch.toLowerCase();
      result = result.filter(row => 
        searchFields.some(field => {
          const value = row[field];
          return value && String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Column filters
    Object.entries(filters).forEach(([field, { value, matchMode }]) => {
      if (value === undefined || value === null || value === '') return;
      
      const column = columns.find(col => col.field === field);
      if (!column) return;

      if (column.filterType === 'text' || !column.filterType) {
        if (matchMode === 'contains') {
          result = result.filter(row => {
            const cellValue = row[field];
            return cellValue && String(cellValue).toLowerCase().includes(String(value).toLowerCase());
          });
        }
      } else if (column.filterType === 'dropdown') {
        result = result.filter(row => row[field] === value);
      } else if (column.filterType === 'number') {
        result = result.filter(row => {
          const cellValue = Number(row[field]);
          const filterValue = Number(value);
          return !isNaN(cellValue) && !isNaN(filterValue) && cellValue >= filterValue;
        });
      }
    });

    return result;
  }, [data, globalSearch, searchFields, filters, columns]);

  // Computed: sorted data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return comparison * sortOrder;
    });
  }, [filteredData, sortField, sortOrder]);

  // Computed: paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  // Select all handler (declared after paginatedData to avoid TDZ issues)
  const handleSelectAllChange = useCallback((e) => {
    if (e.checked) {
      setSelectAll(true);
      setSelectedRows(paginatedData);
    } else {
      setSelectAll(false);
      setSelectedRows([]);
    }
  }, [paginatedData]);

  // Export handlers (declared after filteredData to avoid TDZ issues)
  const handleExportCSV = useCallback(() => {
    if (tableRef.current) {
      tableRef.current.exportCSV();
    }
  }, []);

  const handleExportXLS = useCallback(async () => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(filteredData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${exportFileName}.xlsx`);
    } catch (error) {
      console.error('Export XLS failed:', error);
    }
  }, [filteredData, exportFileName]);

  const handleExportPDF = useCallback(async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      
      const doc = new jsPDF();
      const visibleCols = columns.filter(col => visibleColumns.includes(col.field));
      
      const tableColumns = visibleCols.map(col => ({
        header: col.header,
        dataKey: col.field
      }));
      
      const tableData = filteredData.map(row => {
        const obj = {};
        visibleCols.forEach(col => {
          obj[col.field] = row[col.field];
        });
        return obj;
      });
      
      autoTable(doc, {
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      doc.save(`${exportFileName}.pdf`);
    } catch (error) {
      console.error('Export PDF failed:', error);
    }
  }, [filteredData, columns, visibleColumns, exportFileName]);

  // Computed: totals
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;

  // Computed: page info
  const pageInfo = useMemo(() => {
    if (totalRecords === 0) return 'Showing 0–0 of 0';
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, totalRecords);
    return `Showing ${start}–${end} of ${totalRecords}`;
  }, [currentPage, rowsPerPage, totalRecords]);

  // Computed: active filter tags
  const activeFilterTags = useMemo(() => {
    return Object.entries(filters)
      .filter(([_, { value }]) => value !== undefined && value !== null && value !== '')
      .map(([field, { value }]) => {
        const column = columns.find(col => col.field === field);
        return {
          label: column?.header || field,
          field,
          value
        };
      });
  }, [filters, columns]);

  // Computed: rendered columns
  const renderedColumns = useMemo(() => {
    return columns.filter(col => visibleColumns.includes(col.field));
  }, [columns, visibleColumns]);

  // Return tableProps
  const tableProps = {
    ref: tableRef,
    value: paginatedData,
    selection: selectedRows,
    onSelectionChange: (e) => setSelectedRows(e.value),
    selectAll,
    onSelectAllChange: handleSelectAllChange,
    sortField,
    sortOrder,
    onSort: (e) => {
      setSortField(e.sortField);
      setSortOrder(e.sortOrder);
    },
    emptyMessage: 'No records found',
    tableStyle: { minWidth: '100%' },
  };

  // Return toolbarProps
  const toolbarProps = {
    globalSearch,
    onSearchChange: handleSearchChange,
    rowsPerPage,
    onRowsPerPageChange: handleRowsPerPageChange,
    filterPanelOpen,
    toggleFilterPanel,
    columnPanelOpen,
    toggleColumnPanel,
    onExportCSV: handleExportCSV,
    onExportXLS: handleExportXLS,
    onExportPDF: handleExportPDF,
    totalRecords,
    selectedCount: selectedRows.length,
    hasActiveFilters: activeFilterTags.length > 0,
  };

  // Return filterProps
  const filterProps = {
    columns,
    pendingFilters,
    onPendingFilterChange: handlePendingFilterChange,
    onApplyFilters: handleApplyFilters,
    onResetFilters: handleResetFilters,
    activeFilterTags,
    onRemoveFilter: handleRemoveFilter,
    filterPanelOpen,
  };

  // Return columnProps
  const columnProps = {
    allColumns: columns,
    visibleColumns,
    onToggleColumn: handleToggleColumn,
    columnPanelOpen,
    renderedColumns,
  };

  // Return paginationProps
  const paginationProps = {
    currentPage,
    totalPages,
    totalRecords,
    rowsPerPage,
    pageInfo,
    onPageChange: handlePageChange,
  };

  return {
    tableProps,
    toolbarProps,
    filterProps,
    columnProps,
    paginationProps,
  };
}

export default useDataTable;
