const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  School: 'ri-school-line',
}

const ManualScopeSelectors = ({
  enabled,
  headOffices,
  schoolOptions,
  selectedHeadOfficeId,
  onHeadOfficeChange,
  selectedSchoolId,
  onSchoolChange,
  schoolLabel = 'School',
  showSchoolSelector = true,
  compact = false,
}) => {
  if (!enabled) return null

  const fieldClassName = compact ? 'avm-field' : 'avm-field full'

  return (
    <div className={compact ? 'avm-grid' : 'avm-field full'}>
      <div className={fieldClassName}>
        <label className="avm-label" htmlFor="manualHeadOfficeId">
          Head Office
        </label>
        <div className="avm-input-with-icon" style={{ position: 'relative' }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667085',
              fontSize: '0.95rem',
              lineHeight: 1,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <i className={FIELD_ICONS['Head Office']} />
          </span>
          <select
            id="manualHeadOfficeId"
            className="form-control form-select avm-select avm-input"
            value={selectedHeadOfficeId}
            onChange={(e) => onHeadOfficeChange(e.target.value)}
          >
            <option value="">Select Head Office</option>
            {headOffices.map((ho) => (
              <option key={String(ho.id)} value={String(ho.id)}>
                {ho.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSchoolSelector ? (
        <div className={fieldClassName}>
          <label className="avm-label" htmlFor="manualSchoolId">
            {schoolLabel}
          </label>
          <div className="avm-input-with-icon" style={{ position: 'relative' }}>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#667085',
                fontSize: '0.95rem',
                lineHeight: 1,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <i className={FIELD_ICONS[schoolLabel] || FIELD_ICONS.School} />
            </span>
            <select
              id="manualSchoolId"
              className="form-control form-select avm-select avm-input w-100"
              value={selectedSchoolId}
              onChange={(e) => onSchoolChange(e.target.value)}
              disabled={!selectedHeadOfficeId}
            >
              <option value="">{selectedHeadOfficeId ? `Select ${schoolLabel}` : 'Select Head Office First'}</option>
              {schoolOptions.map((school) => (
                <option key={String(school.id)} value={String(school.id)}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ManualScopeSelectors
