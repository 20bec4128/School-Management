import ManualScopeSelectors from './ManualScopeSelectors'

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  Name: 'ri-hotel-line',
  'Hostel Type': 'ri-community-line',
  Address: 'ri-map-pin-line',
  Note: 'ri-sticky-note-line',
}

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
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
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  )
}

const HostelFormFields = ({
  form,
  setForm,
  isSuperAdmin,
  isHeadOfficeAdmin,
  isSchoolAdmin,
  headOffices = [],
  schoolOptions = [],
  selectedHeadOfficeId = '',
  selectedSchoolId = '',
  onHeadOfficeChange,
  onSchoolChange,
  headOfficeName = '',
  schoolName = '',
}) => {
  const handleFieldChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '' } : {}),
    }))
  }

  return (
    <div className="avm-grid">
      {isSuperAdmin ? (
        <ManualScopeSelectors
          enabled
          headOffices={headOffices}
          schoolOptions={schoolOptions}
          selectedHeadOfficeId={selectedHeadOfficeId}
          onHeadOfficeChange={(val) => onHeadOfficeChange?.(val)}
          selectedSchoolId={selectedSchoolId}
          onSchoolChange={(val) => onSchoolChange?.(val)}
        />
      ) : isHeadOfficeAdmin ? (
        <>
          <FormField label="Head Office" required full>
            <input className="avm-input" value={headOfficeName || ''} readOnly />
          </FormField>
          <FormField label="School Name" required full>
            <select
              className="avm-select"
              id="schoolId"
              value={form.schoolId}
              onChange={(e) => handleFieldChange('schoolId', e.target.value)}
            >
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={String(option.id)} value={String(option.id)}>
                  {option.schoolName}
                </option>
              ))}
            </select>
          </FormField>
        </>
      ) : (
        <>
          <FormField label="Head Office" required full>
            <input className="avm-input" value={headOfficeName || ''} readOnly />
          </FormField>
          <FormField label="School Name" required full>
            <input className="avm-input" value={schoolName || ''} readOnly />
          </FormField>
        </>
      )}

      <FormField label="Name" required >
        <input
          type="text"
          className="avm-input"
          id="name"
          placeholder="Name"
          value={form.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
        />
      </FormField>

      <FormField label="Hostel Type" required >
        <select
          className="avm-select"
          id="hostelType"
          value={form.hostelType}
          onChange={(e) => handleFieldChange('hostelType', e.target.value)}
        >
          <option value="">--Select--</option>
          <option value="Boys">Boys</option>
          <option value="Girls">Girls</option>
          <option value="Mixed">Mixed</option>
        </select>
      </FormField>

      <FormField label="Address" required >
        <input
          type="text"
          className="avm-input"
          id="address"
          placeholder="Address"
          value={form.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
        />
      </FormField>

      <FormField label="Note" full>
        <textarea
          rows={4}
          className="avm-input avm-textarea"
          id="note"
          placeholder="Note"
          value={form.note}
          onChange={(e) => handleFieldChange('note', e.target.value)}
        />
      </FormField>
    </div>
  )
}

export default HostelFormFields
