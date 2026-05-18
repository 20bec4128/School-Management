import { useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import ExportDropdown from '../components/ExportDropdown'
import '../assets/css/addModalShared.css'
import { useAuth } from '../context/useAuth'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import {
  deleteMarkSendSms,
  fetchMarkSendSmsPage,
} from '../apis/markSendSmsApi'

const EXAM_TERM_OPTIONS = ['First Term', 'Second Term', 'Final Term']
const RECEIVER_TYPE_OPTIONS = ['Student', 'Parent', 'Guardian']
const RECEIVER_OPTIONS = ['All', 'Selected Students', 'Selected Parents']
const TEMPLATE_OPTIONS = ['Default Mark SMS', 'Exam Result SMS', 'Parent Notification SMS']
const GATEWAY_OPTIONS = ['Twilio', 'Fast2SMS', 'TextLocal']

const emptyFilters = {
  schoolId: 'Select',
  examTerm: 'Select',
  receiverType: 'Select',
  receiver: 'Select',
  template: 'Select',
  sms: '',
  gateway: 'Select',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'examTerm', label: 'Exam Term' },
  { key: 'receiverType', label: 'Receiver Type' },
  { key: 'receiver', label: 'Receiver' },
  { key: 'template', label: 'Template' },
  { key: 'gateway', label: 'Gateway' },
  { key: 'sendDate', label: 'Send Date' },
]

const MarkSendBySMS = ({ onNavigate }) => {
  const { schoolId, headOfficeId } = useAuth()
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schools, setSchools] = useState([])
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } =
    useColumnVisibility(columnOptions)

  useEffect(() => {
    let cancelled = false
    fetchSchoolsLookup()
      .then((data) => {
        if (!cancelled) setSchools(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setSchools([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const schoolOptions = useMemo(() => {
    return Array.isArray(schools)
      ? schools
          .map((school) => ({
            id: school?.id,
            schoolName: school?.schoolName || '',
            headOfficeId: school?.headOfficeId ?? null,
          }))
          .filter((school) => school.id != null && school.schoolName)
          .sort((a, b) => String(a.schoolName).localeCompare(String(b.schoolName)))
      : []
  }, [schools])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMarkSendSmsPage({
        headOfficeId,
        schoolId,
        examTerm: filters.examTerm,
        receiverType: filters.receiverType,
        receiver: filters.receiver,
        template: filters.template,
        gateway: filters.gateway,
        search,
        page: currentPage - 1,
        size: rowsPerPage,
      })
      setRows(data?.content || [])
      setTotalElements(data?.totalElements || 0)
    } catch (err) {
      setError(err?.message || 'Failed to load SMS history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentPage, rowsPerPage, search, filters, schoolId, headOfficeId])

  const allSelected = rows.length > 0 && rows.every((row) => selectedRows.includes(row.id))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...rows.map((row) => row.id)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !rows.some((row) => row.id === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => {
    sessionStorage.removeItem('MARK_SEND_SMS_EDIT_ID')
    onNavigate?.('mark-send-sms-create')
  }

  const openEdit = (row) => {
    sessionStorage.setItem('MARK_SEND_SMS_EDIT_ID', String(row.id))
    onNavigate?.('mark-send-sms-create')
  }

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this SMS record?')) return
    try {
      await deleteMarkSendSms(row.id)
      setSelectedRows((prev) => prev.filter((id) => id !== row.id))
      loadData()
    } catch (err) {
      alert(err?.message || 'Failed to remove SMS record.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalElements / rowsPerPage))

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Mark Send By SMS</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Mark Send By SMS</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-message-2-line"></i>
          </span>
          Send SMS
        </button>
      </div>

      {error ? <div className="alert alert-danger radius-8">{error}</div> : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Find
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[column.key]}
                          onChange={() => toggleColumn(column.key)}
                        />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.examTerm ? <th scope="col">Exam Term</th> : null}
                  {visibleColumns.receiverType ? <th scope="col">Receiver Type</th> : null}
                  {visibleColumns.receiver ? <th scope="col">Receiver</th> : null}
                  {visibleColumns.template ? <th scope="col">Template</th> : null}
                  {visibleColumns.gateway ? <th scope="col">Gateway</th> : null}
                  {visibleColumns.sendDate ? <th scope="col">Send Date</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40">
                      Loading records...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 1} className="text-center py-40 text-secondary-light">
                      No entries found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                          />
                          <label className="form-check-label">
                            {String(idx + 1 + (currentPage - 1) * rowsPerPage).padStart(2, '0')}
                          </label>
                        </div>
                      </td>
                      {visibleColumns.schoolName ? (
                        <td className="fw-medium text-primary-light">{row.schoolName}</td>
                      ) : null}
                      {visibleColumns.examTerm ? <td>{row.examTerm}</td> : null}
                      {visibleColumns.receiverType ? <td>{row.receiverType}</td> : null}
                      {visibleColumns.receiver ? <td>{row.receiver}</td> : null}
                      {visibleColumns.template ? <td>{row.template || '-'}</td> : null}
                      {visibleColumns.gateway ? (
                        <td>
                          <span className="bg-info-100 text-info-600 px-12 py-4 radius-4 fw-medium text-sm">
                            {row.gateway}
                          </span>
                        </td>
                      ) : null}
                      {visibleColumns.sendDate ? <td>{row.sendDate}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Delete"
                            onClick={() => handleDelete(row)}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, totalElements)} of {totalElements}
            </span>
            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    page === currentPage
                      ? 'btn btn-sm btn-primary-600'
                      : 'btn btn-sm btn-light border'
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Find Mark Send By SMS"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School
            </label>
            <select
              id="schoolId"
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="examTerm" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Exam Term
            </label>
            <select
              id="examTerm"
              className="form-control form-select"
              value={pendingFilters.examTerm}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Exam Term</option>
              {EXAM_TERM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="receiverType" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Receiver Type
            </label>
            <select
              id="receiverType"
              className="form-control form-select"
              value={pendingFilters.receiverType}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Receiver Type</option>
              {RECEIVER_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="receiver" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Receiver
            </label>
            <select
              id="receiver"
              className="form-control form-select"
              value={pendingFilters.receiver}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Receiver</option>
              {RECEIVER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="template" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Template
            </label>
            <select
              id="template"
              className="form-control form-select"
              value={pendingFilters.template}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Template</option>
              {TEMPLATE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="sms" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              SMS
            </label>
            <textarea
              id="sms"
              className="form-control"
              rows="4"
              placeholder="SMS"
              maxLength={160}
              value={pendingFilters.sms}
              onChange={handlePendingFilterChange}
            ></textarea>
            <div className="text-secondary-light text-sm mt-4">
              You have remain character/ letter : {160 - pendingFilters.sms.length}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="gateway" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Gateway
            </label>
            <select
              id="gateway"
              className="form-control form-select"
              value={pendingFilters.gateway}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Gateway</option>
              {GATEWAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button type="button" onClick={handleResetFilters} className="btn btn-danger-200 text-danger-600 w-100">
              Reset
            </button>
          </div>
          <div>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default MarkSendBySMS
