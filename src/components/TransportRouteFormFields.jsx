import ManualScopeSelectors from './ManualScopeSelectors'

const FIELD_ICONS = {
  'Head Office': 'ri-building-4-line',
  'School Name': 'ri-school-line',
  'Route Name': 'ri-map-pin-line',
  'Route Start': 'ri-map-pin-range-line',
  'Route End': 'ri-map-pin-5-line',
  Vehicle: 'ri-bus-2-line',
  Note: 'ri-sticky-note-line',
  'Stop Name': 'ri-road-map-line',
  'Stop KM': 'ri-pin-distance-line',
  'Stop Fare': 'ri-money-dollar-circle-line',
}

const emptyStop = { stopName: '', stopKm: '', stopFare: '' }

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

const TransportRouteFormFields = ({
  form,
  setForm,
  isSuperAdmin,
  isHeadOfficeAdmin,
  isSchoolAdmin,
  headOffices = [],
  schoolOptions = [],
  vehicleOptions = [],
  selectedHeadOfficeId = '',
  selectedSchoolId = '',
  onHeadOfficeChange,
  onSchoolChange,
  headOfficeName = '',
  schoolName = '',
  vehicleLoading = false,
}) => {
  const handleFieldChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === 'headOfficeId' ? { schoolId: '', vehicleId: '' } : {}),
      ...(id === 'schoolId' ? { vehicleId: '' } : {}),
    }))
  }

  const handleStopChange = (index, field, value) => {
    setForm((prev) => {
      const stops = Array.isArray(prev.stops) ? prev.stops : []
      const nextStops = stops.map((stop, i) => (i === index ? { ...stop, [field]: value } : stop))
      return { ...prev, stops: nextStops }
    })
  }

  const addStopRow = () => {
    setForm((prev) => ({
      ...prev,
      stops: [...(Array.isArray(prev.stops) ? prev.stops : []), { ...emptyStop }],
    }))
  }

  const removeStopRow = (index) => {
    setForm((prev) => {
      const stops = Array.isArray(prev.stops) ? prev.stops : []
      if (stops.length === 1) return prev
      return {
        ...prev,
        stops: stops.filter((_, i) => i !== index),
      }
    })
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

      <FormField label="Route Name" required >
        <input
          type="text"
          className="avm-input"
          id="routeName"
          placeholder="Route Name"
          value={form.routeName}
          onChange={(e) => handleFieldChange('routeName', e.target.value)}
        />
      </FormField>
<FormField label="Vehicle" required >
        <select
          className="avm-select"
          id="vehicleId"
          value={form.vehicleId}
          onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
          disabled={!form.schoolId || vehicleLoading}
        >
          <option value="">
            {vehicleLoading ? 'Loading vehicles...' : !form.schoolId ? '--Select School First--' : '--Select Vehicle--'}
          </option>
          {vehicleOptions.map((vehicle) => (
            <option key={String(vehicle.id)} value={String(vehicle.id)}>
              {vehicle.vehicleNumber}{vehicle.vehicleModel ? ` - ${vehicle.vehicleModel}` : ''}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Route Start" required >
        <input
          type="text"
          className="avm-input"
          id="routeStart"
          placeholder="Route Start"
          value={form.routeStart}
          onChange={(e) => handleFieldChange('routeStart', e.target.value)}
        />
      </FormField>

      <FormField label="Route End" required >
        <input
          type="text"
          className="avm-input"
          id="routeEnd"
          placeholder="Route End"
          value={form.routeEnd}
          onChange={(e) => handleFieldChange('routeEnd', e.target.value)}
        />
      </FormField>

      

      <div className="avm-field full">
        <label className="avm-label">Route Stop Fare</label>
        <div className="table-responsive">
          <table className="table bordered-table mb-0 data-table">
            <thead>
              <tr>
                <th>Stop Name</th>
                <th>Stop KM</th>
                <th>Stop Fare</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(form.stops) && form.stops.length > 0 ? form.stops : [{ ...emptyStop }]).map((stop, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      className="form-control avm-input"
                      placeholder="Stop Name"
                      value={stop.stopName}
                      onChange={(e) => handleStopChange(index, 'stopName', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control avm-input"
                      placeholder="Stop KM"
                      value={stop.stopKm}
                      onChange={(e) => handleStopChange(index, 'stopKm', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control avm-input"
                      placeholder="Stop Fare"
                      value={stop.stopFare}
                      onChange={(e) => handleStopChange(index, 'stopFare', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-danger-600 bg-transparent border-0 "
                      onClick={() => removeStopRow(index)}
                      disabled={(form.stops?.length || 1) === 1}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-primary mt-12"
          onClick={addStopRow}
        >
          <i className="ri-add-line"></i> Add Stop
        </button>
      </div>

      <FormField label="Note" full>
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

export default TransportRouteFormFields
