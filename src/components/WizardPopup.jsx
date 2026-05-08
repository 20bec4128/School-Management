const WizardPopup = ({
  open,
  isOpen,
  title,
  steps = [],
  step,
  currentStep,
  onClose,
  onBack,
  onNext,
  onSubmit,
  onSave,
  setCurrentStep,
  children,
  submitLabel = 'Save',
  modalWidth,
}) => {
  const resolvedOpen = open ?? isOpen ?? false
  const resolvedStep = step ?? currentStep ?? 0
  const resolvedSubmit = onSubmit ?? onSave
  const handleBack =
    onBack ??
    (setCurrentStep
      ? () => setCurrentStep((prev) => Math.max(0, prev - 1))
      : undefined)
  const handleNext =
    onNext ??
    (setCurrentStep
      ? () => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
      : undefined)

  if (!resolvedOpen) return null

  const isLast = resolvedStep === steps.length - 1

  return (
    <div className="avm-backdrop">
      <div className="avm-modal"  style={modalWidth ? { maxWidth: modalWidth } : {}} onClick={(e) => e.stopPropagation()}>
        
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
              className={`avm-step${index === resolvedStep ? ' active' : ''}${index < resolvedStep ? ' done' : ''}`}
            >
              <div className="avm-step-dot">{index + 1}</div>
              <span className="avm-step-label">{item}</span>
            </div>
          ))}
        </div>

        <div className="avm-body">{children}</div>

        <div className="avm-footer">
          <div>{resolvedStep > 0 ? <button type="button" className="avm-btn light" onClick={handleBack}>Back</button> : null}</div>
          <div className="avm-footer-right">
            <button type="button" className="avm-btn light" onClick={onClose}>
              Cancel
            </button>
            {isLast ? (
              <button type="button" className="avm-btn primary" onClick={resolvedSubmit}>
                {submitLabel}
              </button>
            ) : (
              <button type="button" className="avm-btn primary" onClick={handleNext}>
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
