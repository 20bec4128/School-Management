import React from 'react';

export function TablePagination({ paginationProps }) {
  const {
    currentPage,
    totalPages,
    pageInfo,
    onPageChange,
  } = paginationProps;

  const pageNumbers = Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
    if (totalPages <= 3) {
      return index + 1;
    }

    if (currentPage <= 2) {
      return index + 1;
    }

    if (currentPage >= totalPages - 1) {
      return totalPages - 2 + index;
    }

    return currentPage - 1 + index;
  }).filter((page, index, arr) => page > 0 && arr.indexOf(page) === index);

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
      <span className="text-sm text-secondary-light">
        {pageInfo}
      </span>

      <div className="d-flex align-items-center gap-8 ms-auto">
        <button
          type="button"
          className="btn btn-sm btn-light border"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            className={page === currentPage ? 'btn btn-sm btn-primary-600' : 'btn btn-sm btn-light border'}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className="btn btn-sm btn-light border"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TablePagination;
