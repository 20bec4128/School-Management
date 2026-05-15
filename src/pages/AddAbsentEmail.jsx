import { useEffect, useState } from 'react'
import AbsentEmailForm from '../components/AbsentEmailForm'
import {
  ABSENT_EMAIL_EDIT_STORAGE_KEY,
  ABSENT_EMAIL_ROWS_STORAGE_KEY,
  absentEmailEmptyForm,
  absentEmailReceiverOptionsMap,
} from '../constants/absentEmail'
import '../assets/css/addModalShared.css'

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(ABSENT_EMAIL_EDIT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const readSavedRows = () => {
  try {
    const raw = sessionStorage.getItem(ABSENT_EMAIL_ROWS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const AddAbsentEmail = ({ onNavigate }) => {
  const [initialEditRow] = useState(() => readEditRow())
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => {
    if (!initialEditRow) return absentEmailEmptyForm

    const receiverOptions = absentEmailReceiverOptionsMap[initialEditRow.receiverType] || []

    return {
      ...absentEmailEmptyForm,
      school: initialEditRow.school || '',
      receiverType: initialEditRow.receiverType || '',
      receiver: initialEditRow.receiver || receiverOptions[0] || '',
      template: initialEditRow.template || '',
      absentDate: initialEditRow.absentDate || initialEditRow.sendDate || '',
      subject: initialEditRow.subject || '',
      emailBody: initialEditRow.emailBody || '',
    }
  })

  const isEditing = Boolean(initialEditRow)

  useEffect(() => () => sessionStorage.removeItem(ABSENT_EMAIL_EDIT_STORAGE_KEY), [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.school.trim()) return setError('School is required')
    if (!form.receiverType.trim()) return setError('Receiver Type is required')
    if (!form.receiver.trim()) return setError('Receiver is required')
    if (!form.absentDate.trim()) return setError('Absent Date is required')
    if (!form.subject.trim()) return setError('Subject is required')
    if (!form.emailBody.trim()) return setError('Email Body is required')

    const existingRows = readSavedRows()
    const nextRow = {
      sl: isEditing ? initialEditRow.sl : String(existingRows.length + 1).padStart(2, '0'),
      school: form.school,
      receiverType: form.receiverType,
      subject: form.subject,
      sendDate: form.absentDate,
      receiver: form.receiver,
      template: form.template,
      emailBody: form.emailBody,
      absentDate: form.absentDate,
    }

    const nextRows = isEditing
      ? existingRows.map((row) => (row.sl === initialEditRow.sl ? nextRow : row))
      : [...existingRows, nextRow]

    sessionStorage.setItem(ABSENT_EMAIL_ROWS_STORAGE_KEY, JSON.stringify(nextRows))
    setSuccess(true)
    setTimeout(() => onNavigate('absent-email'), 1000)
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? 'Edit' : 'Add'} Absent Email</h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / {isEditing ? 'Edit' : 'Add'} Absent Email</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate('absent-email')}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div className="alert alert-success d-flex align-items-center gap-8" role="alert">
          <i className="ri-checkbox-circle-line"></i>
          <span>Absent email {isEditing ? 'updated' : 'saved'} successfully! Redirecting...</span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <AbsentEmailForm form={form} setForm={setForm} />
            <div className="d-flex justify-content-end mt-24">
              <button type="submit" className="btn btn-primary-600">
                {isEditing ? 'Update' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddAbsentEmail
