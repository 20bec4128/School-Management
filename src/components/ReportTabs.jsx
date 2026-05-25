import React from 'react'

const TAB_STYLE = {
  active:
    'bg-base border border-neutral-300 border-bottom-0 text-primary-light shadow-sm',
  inactive:
    'bg-transparent border border-transparent text-secondary-light',
}

export function ReportTabs({
  activeTab,
  onTabChange,
  tabs,
  className = '',
}) {
  return (
    <div className={className}>
      <div className="d-flex flex-wrap align-items-end gap-4 border-bottom border-neutral-200 px-20 pt-12">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              className={`px-12 py-8 radius-top-8 fw-medium text-sm ${TAB_STYLE[isActive ? 'active' : 'inactive']}`}
              onClick={() => onTabChange(tab.key)}
              aria-selected={isActive}
              role="tab"
            >
              <span className="d-inline-flex align-items-center gap-8">
                {tab.icon ? <i className={tab.icon} /> : null}
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ReportTabPanel({ active, children, className = '' }) {
  if (!active) return null
  return <div className={className}>{children}</div>
}
