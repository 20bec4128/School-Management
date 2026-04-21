const WizardPopup = ({
  open,
  title,
  steps,
  step,
  onClose,
  onBack,
  onNext,
  onSubmit,
  children,
  submitLabel = 'Save',
}) => {
  if (!open) return null

  const isLast = step === steps.length - 1

  return (
    <div className="avm-backdrop" onClick={onClose}>
      <div className="avm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avm-modal-header">
          <h2 className="avm-modal-title">{title}</h2>
          <button type="button" className="avm-modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="avm-steps">
          {steps.map((item, index) => (
            <div
              key={item}
              className={`avm-step${index === step ? ' active' : ''}${index < step ? ' done' : ''}`}
            >
              <div className="avm-step-dot">{index + 1}</div>
              <span className="avm-step-label">{item}</span>
            </div>
          ))}
        </div>

        <div className="avm-body">{children}</div>

        <div className="avm-footer">
          <div>{step > 0 ? <button type="button" className="avm-btn light" onClick={onBack}>Back</button> : null}</div>
          <div className="avm-footer-right">
            <button type="button" className="avm-btn light" onClick={onClose}>
              Cancel
            </button>
            {isLast ? (
              <button type="button" className="avm-btn primary" onClick={onSubmit}>
                {submitLabel}
              </button>
            ) : (
              <button type="button" className="avm-btn primary" onClick={onNext}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WizardPopup
