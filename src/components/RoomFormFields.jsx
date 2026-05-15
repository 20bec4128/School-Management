import ManualScopeSelectors from './ManualScopeSelectors'

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Hostel': 'ri-hotel-line',
  'Room No': 'ri-hashtag',
  'Room Type': 'ri-community-line',
  'Seat Total': 'ri-equalizer-line',
  'Cost per Seat': 'ri-money-dollar-circle-line',
  'Note': 'ri-sticky-note-line',
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

const RoomFormFields = ({
  form,
  setForm,
  isSuperAdmin,
  isHeadOfficeAdmin,
  isSchoolAdmin,
  headOffices = [],
  schoolOptions = [],
  hostelOptions = [],
  selectedHeadOfficeId = '',
  selectedSchoolId = '',
  onHeadOfficeChange,
  onSchoolChange,
  headOfficeName = '',
  schoolName = '',
  hostelLoading = false,
}) => {
  const handleFieldChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', hostelId: '' } : {}),
      ...(id === 'schoolId' ? { hostelId: '' } : {}),
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

      <FormField label="Hostel" required full>
        <select
          className="avm-select"
          id="hostelId"
          value={form.hostelId}
          onChange={(e) => handleFieldChange('hostelId', e.target.value)}
          disabled={!form.schoolId || hostelLoading}
        >
          <option value="">
            {hostelLoading ? 'Loading hostels...' : !form.schoolId ? '--Select School First--' : '--Select Hostel--'}
          </option>
          {hostelOptions.map((hostel) => (
            <option key={String(hostel.id)} value={String(hostel.id)}>
              {hostel.hostelName || hostel.name || `Hostel ${hostel.id}`}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Room No" required full>
        <input
          type="text"
          className="avm-input"
          id="roomNo"
          placeholder="Room No"
          value={form.roomNo}
          onChange={(e) => handleFieldChange('roomNo', e.target.value)}
        />
      </FormField>

      <FormField label="Room Type" required full>
        <select
          className="avm-select"
          id="roomType"
          value={form.roomType}
          onChange={(e) => handleFieldChange('roomType', e.target.value)}
        >
          <option value="">--Select--</option>
          <option value="AC">AC</option>
          <option value="Non AC">Non AC</option>
          <option value="Dormitory">Dormitory</option>
        </select>
      </FormField>

      <FormField label="Seat Total" required full>
        <input
          type="number"
          className="avm-input"
          id="seatTotal"
          placeholder="Seat Total"
          value={form.seatTotal}
          onChange={(e) => handleFieldChange('seatTotal', e.target.value)}
        />
      </FormField>

      <FormField label="Cost per Seat" full>
        <input
          type="number"
          className="avm-input"
          id="costPerSeat"
          placeholder="Cost per Seat"
          value={form.costPerSeat}
          onChange={(e) => handleFieldChange('costPerSeat', e.target.value)}
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

export default RoomFormFields
