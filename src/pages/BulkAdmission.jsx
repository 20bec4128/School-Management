import { useMemo, useRef, useState } from 'react'

const academicYearOptions = ['2025-2026', '2026-2027']
const classOptions = ['8', '9', '10', '11', '12']
const sectionOptions = ['A', 'B', 'C', 'D']

const BulkAdmission = ({ onNavigate }) => {
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    school: '',
    academicYear: '',
    className: '',
    section: '',
    csvFile: null,
  })

  const fileName = useMemo(() => form.csvFile?.name || 'No file selected', [form.csvFile])

  const handleChange = (event) => {
    const { id, value } = event.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setForm((prev) => ({ ...prev, csvFile: file }))
  }

  const handleGenerateCsv = () => {
    const headers = [
      'student_name',
      'username',
      'gender',
      'academic_group',
      'blood_group',
      'student_type_id',
      'discount_id',
      'phone',
      'email',
    ]
    const sampleRow = ['John Carter', 'john.carter101', 'male', 'science', 'a_positive', '1', '1', '9876543210', 'john@example.com']
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'bulk-admission-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Bulk Admission</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Bulk Admission</span>
          </div>
        </div>
      </div>

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row g-20">
              <div className="col-md-6">
                <label htmlFor="school" className="form-label fw-semibold text-primary-light">
                  School <span className="text-danger-600">*</span>
                </label>
                <select
                  id="school"
                  className="form-control form-select"
                  value={form.school}
                  onChange={handleChange}
                >
                  <option value="">--Select School--</option>
                  {schoolOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="academicYear" className="form-label fw-semibold text-primary-light">
                  Academic Year <span className="text-danger-600">*</span>
                </label>
                <select
                  id="academicYear"
                  className="form-control form-select"
                  value={form.academicYear}
                  onChange={handleChange}
                >
                  <option value="">--Select--</option>
                  {academicYearOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="className" className="form-label fw-semibold text-primary-light">
                  Class <span className="text-danger-600">*</span>
                </label>
                <select
                  id="className"
                  className="form-control form-select"
                  value={form.className}
                  onChange={handleChange}
                >
                  <option value="">--Select--</option>
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="section" className="form-label fw-semibold text-primary-light">
                  Section <span className="text-danger-600">*</span>
                </label>
                <select
                  id="section"
                  className="form-control form-select"
                  value={form.section}
                  onChange={handleChange}
                >
                  <option value="">--Select--</option>
                  {sectionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold text-primary-light">CSV File</label>
                <div className="border border-neutral-300 radius-12 p-20 d-flex flex-wrap align-items-center justify-content-between gap-12">
                  <div className="d-flex align-items-center gap-10">
                    <span className="w-48-px h-48-px rounded-circle bg-primary-50 text-primary-600 d-flex align-items-center justify-content-center">
                      <i className="ri-file-excel-2-line text-xl"></i>
                    </span>
                    <div>
                      <div className="fw-medium text-primary-light">{fileName}</div>
                      <div className="text-sm text-secondary-light">Upload the edited bulk admission CSV file</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="d-none"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-12 mt-24">
              <button type="button" className="btn btn-warning-600 text-white" onClick={handleGenerateCsv}>
                Generate CSV File
              </button>
              <button type="submit" className="btn btn-primary-600">
                Add
              </button>
            </div>
          </form>

          <div
            className="mt-24 radius-12"
            style={{
              background: '#fff7e6',
              border: '1px solid #f3d18b',
              color: '#8a5a00',
              padding: '1rem 1.1rem',
            }}
          >
            <p className="fw-semibold mb-12">Instruction:</p>
            <ul className="mb-0 ps-20 d-grid gap-8">
              <li>At first select the School, Academic Year, Class and Section.</li>
              <li>Generate CSV file.</li>
              <li>Open the downloaded CSV file and enter student information with unique username.</li>
              <li>Gender: [ male, female ] *</li>
              <li>Academic Group: [ science, arts, commerce ]</li>
              <li>Blood Group: [ a_positive, a_negative, b_positive, b_negative, o_positive, o_negative, ab_positive, ab_negative ]</li>
              <li>Take the Student Type ID from Student Type list Student Type.</li>
              <li>Take the Discount ID from here Discount.</li>
              <li>Save the edited CSV file.</li>
              <li>Upload again CSV file you just edited and submit.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkAdmission
