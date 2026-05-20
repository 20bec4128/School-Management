const SingleStepFormShell = ({
  title,
  breadcrumbTrail,
  onDashboard,
  onBack,
  backLabel = 'Back to List',
  stepLabel = 'Basic Information',
  steps,
  activeStep = 0,
  onStepChange,
  error,
  success,
  successMessage,
  children,
  footer,
}) => {
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{title}</h1>

          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={onDashboard}
            >
              Dashboard
            </button>

            <span className="text-secondary-light">{breadcrumbTrail}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={onBack}
        >
          <i className="ri-arrow-left-line" /> {backLabel}
        </button>
      </div>

      <div className="card h-100">
        {Array.isArray(steps) && steps.length > 0 ? (
          <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => onStepChange?.(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeStep === index ? '2px solid var(--primary-600, #4f46e5)' : '2px solid transparent',
                  color: activeStep === index ? 'var(--primary-600, #4f46e5)' : 'var(--secondary-light, #667085)',
                  fontWeight: activeStep === index ? 600 : 400,
                  padding: '14px 20px',
                  cursor: onStepChange ? 'pointer' : 'default',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {step}
              </button>
            ))}
          </div>
        ) : stepLabel ? (
          <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
            <div
              style={{
                borderBottom: '2px solid var(--primary-600, #4f46e5)',
                color: 'var(--primary-600, #4f46e5)',
                fontWeight: 600,
                padding: '14px 20px',
                fontSize: '0.875rem',
              }}
            >
              {stepLabel}
            </div>
          </div>
        ) : null}

        <div className="card-body p-24">
          {error ? (
            <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-error-warning-line text-lg" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-checkbox-circle-line text-lg" />
              {successMessage}
            </div>
          ) : null}

          <div className="tab-content">{children}</div>

          {footer ? (
            <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SingleStepFormShell
