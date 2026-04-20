import React from 'react';

export function TablePagination({ paginationProps }) {
  const {
    currentPage,
    totalPages,
    totalRecords,
    rowsPerPage,
    pageInfo,
    onPageChange,
  } = paginationProps;

  // Generate smart page buttons
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
      {/* Left: Page info */}
      <div className="text-muted small">
        {pageInfo}
      </div>

      {/* Right: Pagination controls */}
      <nav>
        <ul className="pagination pagination-sm mb-0">
          {/* Previous button */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
          </li>

          {/* Page numbers */}
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <li key={`dots-${index}`} className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              );
            }

            const isActive = page === currentPage;

            return (
              <li key={page} className={`page-item ${isActive ? 'active' : ''}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              </li>
            );
          })}

          {/* Next button */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default TablePagination;