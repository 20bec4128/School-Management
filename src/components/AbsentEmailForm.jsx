import {
  absentEmailEmptyForm,
  absentEmailReceiverOptionsMap,
  absentEmailTemplateOptions,
} from '../constants/absentEmail'

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Receiver Type': 'ri-group-line',
  Receiver: 'ri-user-3-line',
  Template: 'ri-file-list-3-line',
  'Absent Date': 'ri-calendar-2-line',
  Subject: 'ri-mail-open-line',
  'Email Body': 'ri-mail-send-line',
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

const AbsentEmailForm = ({ form, setForm }) => {
  const receiverOptions = form.receiverType ? absentEmailReceiverOptionsMap[form.receiverType] || [] : []

  const handleFieldChange = (e) => {
    const { id, value } = e.target

    setForm((prev) => {
      if (id === 'receiverType') {
        return {
          ...prev,
          receiverType: value,
          receiver: '',
        }
      }

      if (id === 'template') {
        const selectedTemplate = absentEmailTemplateOptions[value]
        return {
          ...prev,
          template: value,
          subject: selectedTemplate ? selectedTemplate.subject : prev.subject,
          emailBody: selectedTemplate ? selectedTemplate.emailBody : prev.emailBody,
        }
      }

      return { ...prev, [id]: value }
    })
  }

  return (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        <FormField label="School Name" required full>
          <select className="avm-select" id="school" value={form.school} onChange={handleFieldChange}>
            <option value="">--Select School--</option>
            <option>Windsor Park High School</option>
          </select>
        </FormField>

        <FormField label="Receiver Type" required>
          <select className="avm-select" id="receiverType" value={form.receiverType} onChange={handleFieldChange}>
            <option value="">--Select --</option>
            <option>Student</option>
            <option>Parent</option>
            <option>Guardian</option>
          </select>
        </FormField>

        <FormField label="Receiver" required>
          <select
            className="avm-select"
            id="receiver"
            value={form.receiver}
            onChange={handleFieldChange}
            disabled={!form.receiverType}
          >
            <option value="">--Select--</option>
            {receiverOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Template">
          <select className="avm-select" id="template" value={form.template} onChange={handleFieldChange}>
            <option value="">--Select--</option>
            {Object.keys(absentEmailTemplateOptions).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Absent Date" required>
          <input type="date" className="avm-input" id="absentDate" value={form.absentDate} onChange={handleFieldChange} />
        </FormField>

        <FormField label="Subject" required full>
          <input
            type="text"
            className="avm-input"
            id="subject"
            placeholder="Enter subject"
            value={form.subject}
            onChange={handleFieldChange}
          />
        </FormField>

        <FormField label="Email Body" required full>
          <textarea
            rows="5"
            className="avm-input avm-textarea"
            id="emailBody"
            placeholder="Enter email body"
            value={form.emailBody}
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
                      emailBody: prev.emailBody ? `${prev.emailBody} ${tag}` : tag,
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
