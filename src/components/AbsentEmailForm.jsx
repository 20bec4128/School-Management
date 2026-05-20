const FIELD_ICONS = {
  'Head Office': 'ri-building-2-line',
  'School': 'ri-school-line',
  'Enabled': 'ri-toggle-line',
  'Subject Template': 'ri-mail-open-line',
  'Email Body Template': 'ri-mail-send-line',
  'Dynamic Tag': 'ri-price-tag-3-line',
}

const dynamicTags = [
  '{school_name}',
  '{receiver_name}',
  '{student_name}',
  '{class_name}',
  '{section_name}',
  '{absent_date}',
]

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {!noIcon ? (
        <div className="avm-input-with-icon" style={{ position: 'relative' }}>
          <span
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
      ) : (
        children
      )}
    </div>
  )
}

const normalizeId = (value) => String(value ?? '').trim()

const AbsentEmailForm = ({ form, setForm, isSuperAdmin, isHeadOfficeAdmin, headOfficeOptions, schoolOptions }) => {
  const handleFieldChange = (e) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => {
      if (id === 'enabled') return { ...prev, enabled: Boolean(checked) }
      if (id === 'headOfficeId') return { ...prev, headOfficeId: value, schoolId: '' }
      return { ...prev, [id]: value }
    })
  }

  return (
    <>
      <p className="avm-section-title">Absent Email Settings</p>
      <div className="avm-grid">
        {(isSuperAdmin || isHeadOfficeAdmin) ? (
          <FormField label="Head Office" required full>
            <select className="avm-select" id="headOfficeId" value={form.headOfficeId || ''} onChange={handleFieldChange}>
              <option value="">--Select Head Office--</option>
              {(Array.isArray(headOfficeOptions) ? headOfficeOptions : []).map((row) => {
                const id = normalizeId(row?.id)
                if (!id) return null
                return (
                  <option key={id} value={id}>
                    {row?.name || `Head Office ${id}`}
                  </option>
                )
              })}
            </select>
          </FormField>
        ) : null}

        <FormField label="School" required full>
          <select
            className="avm-select"
            id="schoolId"
            value={form.schoolId || ''}
            onChange={handleFieldChange}
            disabled={!isSuperAdmin && !isHeadOfficeAdmin}
          >
            <option value="">--Select School--</option>
            {(Array.isArray(schoolOptions) ? schoolOptions : []).map((row) => {
              const id = normalizeId(row?.id)
              if (!id) return null
              return (
                <option key={id} value={id}>
                  {row?.schoolName || row?.name || `School ${id}`}
                </option>
              )
            })}
          </select>
        </FormField>

        <FormField label="Enabled" full>
          <div className="d-flex align-items-center gap-10" style={{ paddingLeft: '2.25rem' }}>
            <input
              id="enabled"
              type="checkbox"
              className="form-check-input mt-0"
              checked={Boolean(form.enabled)}
              onChange={handleFieldChange}
            />
            <span className="text-secondary-light">Send absent emails automatically on attendance save</span>
          </div>
        </FormField>

        <FormField label="Subject Template" required full>
          <input
            type="text"
            className="avm-input"
            id="subjectTemplate"
            placeholder="Enter subject template"
            value={form.subjectTemplate || ''}
            onChange={handleFieldChange}
          />
        </FormField>

        <FormField label="Email Body Template" required full>
          <textarea
            rows="6"
            className="avm-input avm-textarea"
            id="emailBodyTemplate"
            placeholder="Enter email body template"
            value={form.emailBodyTemplate || ''}
            onChange={handleFieldChange}
          />
        </FormField>

        <FormField label="Dynamic Tag" full noIcon>
          <div
            style={{
              border: '1px solid #d0d5dd',
              borderRadius: '0.9rem',
              padding: '0.9rem',
              background: '#f8fafc',
            }}
          >
            <div className="avm-chip-wrap" style={{ marginTop: 0 }}>
              {dynamicTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="avm-chip"
                  style={{ border: 'none', cursor: 'pointer' }}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      emailBodyTemplate: prev.emailBodyTemplate ? `${prev.emailBodyTemplate} ${tag}` : tag,
                    }))
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </FormField>
      </div>
    </>
  )
}

export default AbsentEmailForm

