import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import ExportDropdown from '../components/ExportDropdown'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { TablePagination } from '../components/table'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { createFaq, deleteFaq, fetchFaqsPage, updateFaq } from '../apis/faqsApi'
import { useAuth } from '../context/useAuth'
import { useManualSchoolScope } from '../hooks/useManualSchoolScope'
import { normalizeRole } from '../utils/roles'
import '../assets/css/addModalShared.css'

const STEPS = ['Basic Information']

const emptyForm = {
  headOfficeId: '',
  schoolId: '',
  title: '',
  description: '',
}

const emptyFilters = {
  headOfficeId: '',
  schoolId: 'Select',
}

const FIELD_ICONS = {
  'Head Office': 'ri-government-line',
  'School Name': 'ri-school-line',
  Title: 'ri-question-line',
  Description: 'ri-article-line',
}

const columnOptions = [
  { key: 'schoolName', label: 'School' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
]

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.85rem', top: label === 'Description' ? '1.15rem' : '50%', transform: label === 'Description' ? 'none' : 'translateY(-50%)', color: '#667085', zIndex: 1 }}>
          <i className={icon} />
        </span>
        {children}
      </div>
    </div>
  )
}

const fetchAllPages = async (query) => {
  const firstPage = await fetchFaqsPage({ ...query, page: 0, size: 100 })
  const firstRows = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  if (totalPages <= 1) return firstRows
  const requests = []
  for (let page = 1; page < totalPages; page += 1) requests.push(fetchFaqsPage({ ...query, page, size: 100 }))
  const rest = await Promise.all(requests)
  return rest.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstRows])
}

const FAQ = () => {
  const { role, headOfficeId: authHeadOfficeId, schoolId: authSchoolId, schoolName: authSchoolName } = useAuth()
  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'
  const manualScope = useManualSchoolScope(isSuperAdmin)

  const [allSchools, setAllSchools] = useState([])
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  useEffect(() => {
    let cancelled = false
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup()
        if (!cancelled) setAllSchools(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setAllSchools([])
      }
    }
    void loadSchools()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedHeadOfficeId = useMemo(() => {
    if (filters.headOfficeId && filters.headOfficeId !== 'Select') return String(filters.headOfficeId)
    if (isSuperAdmin) return manualScope.selectedHeadOfficeId ? String(manualScope.selectedHeadOfficeId) : ''
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    if (isSchoolAdmin) {
      const school = allSchools.find((item) => String(item.id) === String(authSchoolId ?? ''))
      return school?.headOfficeId != null ? String(school.headOfficeId) : ''
    }
    return ''
  }, [allSchools, authHeadOfficeId, authSchoolId, filters.headOfficeId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.selectedHeadOfficeId])

  const selectedSchoolId = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== 'Select') return String(filters.schoolId)
    if (isSuperAdmin) return manualScope.selectedSchoolId ? String(manualScope.selectedSchoolId) : ''
    if (isSchoolAdmin) return authSchoolId != null ? String(authSchoolId) : ''
    return ''
  }, [authSchoolId, filters.schoolId, isSchoolAdmin, isSuperAdmin, manualScope.selectedSchoolId])

  const schoolOptions = useMemo(() => {
    const rowsList = Array.isArray(allSchools) ? allSchools : []
    if (isSuperAdmin && selectedHeadOfficeId) {
      return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(selectedHeadOfficeId))
    }
    if (isSuperAdmin) return Array.isArray(manualScope.schoolOptions) ? manualScope.schoolOptions : rowsList
    if (isHeadOfficeAdmin) return rowsList.filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId ?? ''))
    if (isSchoolAdmin) return rowsList.filter((school) => String(school?.id ?? '') === String(authSchoolId ?? ''))
    return rowsList
  }, [allSchools, authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, selectedHeadOfficeId])

  const loadRows = async () => {
    const result = await fetchFaqsPage({
      headOfficeId: selectedHeadOfficeId || undefined,
      schoolId: selectedSchoolId || undefined,
      title: undefined,
      search,
      page: currentPage - 1,
      size: rowsPerPage,
    })
    setRows(Array.isArray(result?.content) ? result.content : [])
    setTotalElements(Number(result?.totalElements ?? 0))
    setTotalPages(Number(result?.totalPages ?? 1) || 1)
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        await loadRows()
      } catch {
        if (!cancelled) {
          setRows([])
          setTotalElements(0)
          setTotalPages(1)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedHeadOfficeId, selectedSchoolId, rowsPerPage, search])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      headOfficeId: selectedHeadOfficeId,
      schoolId: selectedSchoolId || (isSchoolAdmin ? String(authSchoolId ?? '') : ''),
    })
    setIsModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setFormData({
      headOfficeId: row.headOfficeId != null ? String(row.headOfficeId) : '',
      schoolId: row.schoolId != null ? String(row.schoolId) : '',
      title: row.title || '',
      description: row.description || '',
    })
    if (isSuperAdmin && row.headOfficeId != null && row.schoolId != null) {
      manualScope.setSelectedScope(String(row.headOfficeId), String(row.schoolId))
    }
    setIsModalOpen(true)
  }

  const handleExportExcel = async () => {
    const exportRows = await fetchAllPages({
      headOfficeId: selectedHeadOfficeId || undefined,
      schoolId: selectedSchoolId || undefined,
      search,
    })
    const normalized = exportRows.map((row) => ({
      School: row.schoolName || '',
      Title: row.title || '',
      Description: row.description || '',
    }))
    const ws = XLSX.utils.json_to_sheet(normalized)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'FAQs')
    XLSX.writeFile(wb, 'FAQ_List.xlsx')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        headOfficeId: isSuperAdmin ? (manualScope.selectedHeadOfficeId ? Number(manualScope.selectedHeadOfficeId) : null) : (authHeadOfficeId ?? null),
        schoolId: isSuperAdmin ? (manualScope.selectedSchoolId ? Number(manualScope.selectedSchoolId) : null) : (authSchoolId ?? null),
        title: formData.title.trim(),
        description: formData.description.trim(),
      }
      if (editingId != null) {
        await updateFaq(editingId, payload)
      } else {
        await createFaq(payload)
      }
      setIsModalOpen(false)
      await loadRows()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete FAQ "${row.title}"?`)) return
    await deleteFaq(row.id)
    await loadRows()
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">FAQ</h1>
          <span className="text-secondary-light">Frontend / FAQ Management</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={openAdd}>
          <i className="ri-add-large-line" /> Add FAQ
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />
              <button className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" onClick={() => setIsFilterOpen(true)}>
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line" />
              </button>
              <div className="dropdown">
                <button type="button" className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white" data-bs-toggle="dropdown">
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line" />
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input type="checkbox" className="form-check-input mt-0" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <RowsPerPageSelect
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(next) => {
                  setRowsPerPage(next)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line" />
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {columnOptions.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input type="checkbox" className="form-check-input" />
                          <label className="form-check-label">{(currentPage - 1) * rowsPerPage + idx + 1}</label>
                        </div>
                      </td>
                      {columnOptions.map((col) => visibleColumns[col.key] && (
                        <td key={col.key}>
                          {col.key === 'title' ? (
                            <span className="fw-medium text-primary-light">{row.title}</span>
                          ) : row[col.key]}
                        </td>
                      ))}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button type="button" className="text-info-600 bg-info-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => openEdit(row)}>
                            <i className="ri-edit-line" />
                          </button>
                          <button type="button" className="text-danger-600 bg-danger-focus w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0" onClick={() => handleDelete(row)}>
                            <i className="ri-delete-bin-line" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-20 py-16 border-top border-neutral-200">
            <TablePagination
              paginationProps={{
                currentPage,
                totalPages,
                pageInfo: `Showing ${totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements} entries`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <WizardPopup
        modalWidth="540px"
        open={isModalOpen}
        title={editingId ? 'Edit FAQ' : 'Add FAQ'}
        steps={STEPS}
        step={0}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        submitLabel={saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
      >
        <div className="avm-grid">
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => manualScope.setSelectedScope(value, '')}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)}
            />
          ) : (
            <>
              <FormField label="Head Office" required>
                <input className="avm-input" value={isSchoolAdmin ? authHeadOfficeId ?? '' : authHeadOfficeId ?? ''} disabled />
              </FormField>
              <FormField label="School Name" required>
                <select className="avm-select" id="schoolId" value={formData.schoolId} onChange={handleInputChange} disabled={isSchoolAdmin}>
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={school.id} value={String(school.id)}>{school.schoolName}</option>
                  ))}
                </select>
              </FormField>
            </>
          )}

          <FormField label="Title" required full>
            <input type="text" className="avm-input" id="title" placeholder="Enter title" value={formData.title} onChange={handleInputChange} />
          </FormField>

          <FormField label="Description" required full>
            <textarea rows={6} className="avm-input avm-textarea" id="description" placeholder="Enter description" value={formData.description} onChange={handleInputChange} style={{ paddingLeft: '2.5rem' }} />
          </FormField>
        </div>
      </WizardPopup>

      <SlideSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Find FAQ">
        <form className="p-20 d-grid gap-16" onSubmit={(e) => { e.preventDefault(); setIsFilterOpen(false); setCurrentPage(1); }}>
          {isSuperAdmin ? (
            <ManualScopeSelectors
              enabled
              headOffices={manualScope.headOffices}
              schoolOptions={manualScope.schoolOptions}
              selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
              onHeadOfficeChange={(value) => {
                manualScope.setSelectedScope(value, '')
                setFilters((prev) => ({ ...prev, headOfficeId: value, schoolId: 'Select' }))
              }}
              selectedSchoolId={manualScope.selectedSchoolId}
              onSchoolChange={(value) => {
                manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value)
                setFilters((prev) => ({ ...prev, schoolId: value || 'Select' }))
              }}
            />
          ) : (
            <div>
              <label className="text-sm fw-semibold text-primary-light mb-8">School</label>
              <select className="form-control form-select" value={filters.schoolId} onChange={(e) => setFilters((prev) => ({ ...prev, schoolId: e.target.value || 'Select' }))}>
                <option value="Select">--Select School--</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>{school.schoolName}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary-600 w-100">Apply Filter</button>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default FAQ
