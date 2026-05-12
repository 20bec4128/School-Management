const SlideSidebar = ({ isOpen, show, title, onClose, children, className = '' }) => {
  const resolvedOpen = isOpen ?? show ?? false
  const panelClass = [
    className,
    'bg-white',
    'position-fixed',
    'end-0',
    'top-0',
    'h-100vh',
    'overflow-y-auto',
    'z-99',
    'max-w-700-px',
    'w-100',
    'translate-x-full',
    'duration-300',
    'active-translate-0',
    resolvedOpen ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={panelClass}>
      <div className="px-20 py-12 border-bottom d-flex align-items-center justify-content-between gap-20">
        <h5 className="text-lg mb-0">{title}</h5>
        <button
          type="button"
          className="text-danger-600 text-lg d-flex border-0 bg-transparent"
          onClick={onClose}
        >
          <i className="ri-close-large-line"></i>
        </button>
      </div>
      {children}
    </div>
  )
}

export default SlideSidebar
