import ManualScopeSelectors from './ManualScopeSelectors'
import PhoneField from './PhoneField'

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Vehicle Number': 'ri-steering-fill',
  'Vehicle Model': 'ri-car-line',
  Driver: 'ri-user-follow-line',
  'Vehicle License': 'ri-id-card-line',
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

const VehicleFormFields = ({
  form,
  setForm,
  isSuperAdmin,
  isHeadOfficeAdmin,
  isSchoolAdmin,
  headOffices = [],
  schoolOptions = [],
  driverEmployees = [],
  selectedHeadOfficeId = '',
  selectedSchoolId = '',
  onHeadOfficeChange,
  onSchoolChange,
  headOfficeName = '',
  schoolName = '',
  driverLoading = false,
}) => {
  const handleFieldChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', driverEmployeeId: '' } : {}),
      ...(id === 'schoolId' ? { driverEmployeeId: '' } : {}),
    }))
  }

  const handlePhoneChange = (value) => {
    const trimmed = String(value || '').trim()
    const parts = trimmed ? trimmed.split(/\s+/) : []
    const code = parts.length > 0 ? parts[0] : '+91'
    const number = parts.length > 1 ? parts.slice(1).join(' ') : ''
    setForm((prev) => ({
      ...prev,
      vehicleContactCountryCode: code,
      vehicleContactNumber: number,
    }))
  }

  const phoneValue = `${form.vehicleContactCountryCode || '+91'}${form.vehicleContactNumber ? ` ${form.vehicleContactNumber}` : ''}`

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
          <FormField label="Head Office" required >
            <input className="avm-input" value={headOfficeName || ''} readOnly />
          </FormField>
          <FormField label="School Name" required >
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
          <FormField label="Head Office" required >
            <input className="avm-input" value={headOfficeName || ''} readOnly />
          </FormField>
          <FormField label="School Name" required >
            <input className="avm-input" value={schoolName || ''} readOnly />
          </FormField>
        </>
      )}

      <FormField label="Vehicle Number" required >
        <input
          type="text"
          className="avm-input"
          id="vehicleNumber"
          placeholder="Vehicle Number"
          value={form.vehicleNumber}
          onChange={(e) => handleFieldChange('vehicleNumber', e.target.value)}
        />
      </FormField>

      <FormField label="Vehicle Model" >
        <input
          type="text"
          className="avm-input"
          id="vehicleModel"
          placeholder="Vehicle Model"
          value={form.vehicleModel}
          onChange={(e) => handleFieldChange('vehicleModel', e.target.value)}
        />
      </FormField>

      <FormField label="Driver" required >
        <select
          className="avm-select"
          id="driverEmployeeId"
          value={form.driverEmployeeId}
          onChange={(e) => handleFieldChange('driverEmployeeId', e.target.value)}
          disabled={!form.schoolId || driverLoading}
        >
          <option value="">{driverLoading ? 'Loading drivers...' : (!form.schoolId ? '--Select School First--' : '--Select Driver--')}</option>
          {driverEmployees.map((employee) => (
            <option key={String(employee.id)} value={String(employee.id)}>
              {employee.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Vehicle License" >
        <input
          type="text"
          className="avm-input"
          id="vehicleLicense"
          placeholder="Vehicle License"
          value={form.vehicleLicense}
          onChange={(e) => handleFieldChange('vehicleLicense', e.target.value)}
        />
      </FormField>

      <PhoneField
        id="vehicleContact"
        label="Vehicle Contact"
        required
        value={phoneValue}
        onChange={handlePhoneChange}
      />

      <FormField label="Note" >
        <textarea
          className="avm-input avm-textarea"
          id="note"
          rows="3"
          placeholder="Note"
          value={form.note}
          onChange={(e) => handleFieldChange('note', e.target.value)}
        />
      </FormField>
    </div>
  )
}

export default VehicleFormFields
