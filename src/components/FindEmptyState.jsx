const FindEmptyState = ({ title, description, buttonLabel, onFind }) => {
  return (
    <div className="py-32 text-center">
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-16"
        style={{ width: 56, height: 56, background: '#f2f4f7', color: '#1d2939' }}
        aria-hidden="true"
      >
        <i className="ri-search-line" style={{ fontSize: 22 }}></i>
      </div>
      {title ? <div className="fw-semibold text-primary-light mb-6">{title}</div> : null}
      {description ? <div className="text-secondary-light mb-16">{description}</div> : null}
      <button type="button" className="btn btn-primary-600" onClick={onFind}>
        <i className="ri-filter-3-line me-8"></i>
        {buttonLabel || 'Find'}
      </button>
    </div>
  )
}

export default FindEmptyState

