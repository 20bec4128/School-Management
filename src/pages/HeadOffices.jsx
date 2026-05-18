import { useEffect, useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { TablePagination } from '../components/table'
import {
  activateHeadOffice,
  createHeadOfficeWithAdmin,
  deactivateHeadOffice,
  deleteHeadOffice,
  fetchHeadOfficeAdmin,
  fetchHeadOfficesPage,
  updateHeadOfficeAdmin,
  updateHeadOffice,
} from '../apis/headOfficesApi'
import { getCurrentRole } from '../utils/currentUser'
import "../assets/css/addModalShared.css"
import ExportDropdown from '../components/ExportDropdown'

const buildEmptyForm = () => ({
  name: '',
  status: 'ACTIVE',
  adminUsername: '',
  adminPassword: '',
})

const emptyFilters = {
  name: 'Select',
  status: 'Select',
}

const FIELD_ICONS = {
  "Head Office Name": "ri-building-line",
  "Status": "ri-toggle-line",
  "Head Office Admin Username": "ri-user-line",
  "Head Office Admin Password": "ri-lock-password-line",
  "Admin Username": "ri-user-line",
  "Admin Password": "ri-lock-password-line",
};

const columnOptions = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
]

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#667085",
            zIndex: 1,
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const HeadOffices = () => {
  const [rows, setRows] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const isSuperAdmin = getCurrentRole() === 'SUPER_ADMIN'

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState(buildEmptyForm)
  const [saving, setSaving] = useState(false)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', status: 'ACTIVE', adminUsername: '', adminPassword: '' })
  const [updating, setUpdating] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const statusFilter = filters.status !== 'Select' ? filters.status : ''
      const nameFilter = filters.name !== 'Select' ? filters.name : ''
      const effectiveSearch = String(search || nameFilter || '').trim()

      const pageData = await fetchHeadOfficesPage(currentPage - 1, rowsPerPage, {
        search: effectiveSearch,
        status: statusFilter,
      })
      setRows(Array.isArray(pageData?.content) ? pageData.content : [])
      setTotalElements(Number(pageData?.totalElements ?? 0))
      setTotalPages(Math.max(1, Number(pageData?.totalPages ?? 1)))
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e?.message || 'Failed to load head offices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [currentPage, filters.name, filters.status, rowsPerPage, search])

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleCreate = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await createHeadOfficeWithAdmin({
        headOffice: { name: form.name || '', status: form.status || 'ACTIVE' },
        admin: { username: form.adminUsername || '', password: form.adminPassword || '' },
      })
      setIsCreateOpen(false)
      setForm(buildEmptyForm())
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to create head office')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (row) => {
    const id = row?.id
    if (id == null) return
    const name = row?.name || `#${id}`
    const ok = window.confirm(`Deactivate head office "${name}"?`)
    if (!ok) return
    setError('')
    try {
      await deactivateHeadOffice(id)
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to deactivate head office')
    }
  }

  const handleActivate = async (row) => {
    const id = row?.id
    if (id == null) return
    const name = row?.name || `#${id}`
    const ok = window.confirm(`Activate head office "${name}"?`)
    if (!ok) return
    setError('')
    try {
      await activateHeadOffice(id)
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to activate head office')
    }
  }

  const openEdit = async (row) => {
    const id = row?.id
    if (id == null) return
    setEditId(id)
    setEditForm({
      name: row?.name || '',
      status: String(row?.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      adminUsername: '',
      adminPassword: '',
    })
    setIsEditOpen(true)
    try {
      const admin = await fetchHeadOfficeAdmin(id)
      setEditForm((prev) => ({ ...prev, adminUsername: admin?.username || '' }))
    } catch {
      // ignore
    }
  }

  const handleEditChange = (e) => {
    const { id, value } = e.target
    setEditForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleUpdate = async () => {
    if (updating) return
    if (editId == null) return
    if (!String(editForm.name || '').trim()) {
      setError('Head office name is required')
      return
    }
    setUpdating(true)
    setError('')
    try {
      await updateHeadOffice(editId, { name: editForm.name || '', status: editForm.status || 'ACTIVE' })
      if (String(editForm.adminUsername || '').trim() || String(editForm.adminPassword || '').trim()) {
        await updateHeadOfficeAdmin(editId, {
          username: editForm.adminUsername || '',
          password: editForm.adminPassword || '',
        })
      }
      setIsEditOpen(false)
      setEditId(null)
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to update head office')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (row) => {
    const id = row?.id
    if (id == null) return
    const name = row?.name || `#${id}`
    const ok = window.confirm(`Delete head office "${name}"? This cannot be undone.`)
    if (!ok) return
    setError('')
    try {
      await deleteHeadOffice(id)
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to delete head office')
    }
  }

  const handleFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const loadExportRows = async () => {
    const statusFilter = filters.status !== 'Select' ? filters.status : ''
    const nameFilter = filters.name !== 'Select' ? filters.name : ''
    const effectiveSearch = String(search || nameFilter || '').trim()
    const pageData = await fetchHeadOfficesPage(0, 10000, { search: effectiveSearch, status: statusFilter })
    return Array.isArray(pageData?.content) ? pageData.content : []
  }

  const handleExportExcel = async () => {
    const exportRows = await loadExportRows()
    const ws = XLSX.utils.json_to_sheet(
      exportRows.map((row) => ({
        ID: row.id,
        Name: row.name,
        Status: row.status,
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'HeadOffices')
    XLSX.writeFile(wb, 'Head_Offices_List.xlsx')
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Head Offices</h1>
          <span className="text-secondary-light">Administrator / Head Offices</span>
        </div>
        <button className="btn btn-primary-600 d-flex align-items-center gap-6" onClick={() => setIsCreateOpen(true)}>
          <i className="ri-add-large-line"></i> Add Head Office
        </button>
      </div>

      {error && <div className="alert alert-danger mb-24 radius-8">{error}</div>}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={handleExportExcel} />

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                  data-bs-toggle="dropdown"
                >
                  <span className="text-secondary-light text-sm">Columns</span>
                  <i className="ri-arrow-down-s-line"></i>
                </button>
                <ul className="dropdown-menu p-12 border shadow">
                  {columnOptions.map((col) => (
                    <li key={col.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                        />
                        {col.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => setIsFilterOpen(true)}
              >
                <span className="text-secondary-light text-sm">Find</span>
                <i className="ri-arrow-right-line"></i>
              </button>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input type="text" className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 90 }}>ID</th>
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.status ? <th scope="col" style={{ width: 120 }}>Status</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">No records found.</td></tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      {visibleColumns.name ? (
                        <td>
                          <span className="fw-medium text-primary-light">{row.name || '-'}</span>
                        </td>
                      ) : null}
                      {visibleColumns.status ? (
                        <td>
                          <span className={`px-12 py-4 radius-4 fw-medium text-sm ${String(row.status || '').toUpperCase() === "ACTIVE" ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}>
                            {row.status || '-'}
                          </span>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          {String(row.status || '').toUpperCase() === 'INACTIVE' ? (
                            <button
                              className="text-success-600 bg-success-focus w-32-px h-32-px rounded-circle border-0 d-flex align-items-center justify-content-center"
                              onClick={() => handleActivate(row)}
                              title="Activate"
                            >
                              <i className="ri-checkbox-circle-line"></i>
                            </button>
                          ) : (
                            <button
                              className="text-warning-600 bg-warning-focus w-32-px h-32-px rounded-circle border-0 d-flex align-items-center justify-content-center"
                              onClick={() => handleDeactivate(row)}
                              title="Deactivate"
                            >
                              <i className="ri-close-circle-line"></i>
                            </button>
                          )}
                          <button 
                            className="text-info-600 bg-info-focus w-32-px h-32-px rounded-circle border-0 d-flex align-items-center justify-content-center" 
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          {isSuperAdmin && (
                            <button 
                              className="text-danger-600 bg-danger-focus w-32-px h-32-px rounded-circle border-0 d-flex align-items-center justify-content-center" 
                              onClick={() => handleDelete(row)}
                              disabled={
                                String(row.status || '').toUpperCase() !== 'INACTIVE' ||
                                String(row.name || '').toUpperCase() === 'DEFAULT_HEAD_OFFICE'
                              }
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          )}
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
                totalRecords: totalElements,
                rowsPerPage,
                pageInfo: `Showing ${totalElements === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalElements)} of ${totalElements}`,
                onPageChange: (next) => setCurrentPage(Math.min(Math.max(1, Number(next) || 1), totalPages)),
              }}
            />
          </div>
        </div>
      </div>

      <SlideSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Find Head Office"
      >
        <form className="p-20 d-grid gap-16" onSubmit={handleApplyFilters}>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Head Office Name</label>
            <select
              id="name"
              className="form-control form-select"
              value={pendingFilters.name}
              onChange={handleFilterChange}
            >
              <option value="Select">--Select Head Office--</option>
              {Array.from(new Set(rows.map((row) => row.name).filter(Boolean))).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm fw-semibold text-primary-light mb-8">Status</label>
            <select
              id="status"
              className="form-control form-select"
              value={pendingFilters.status}
              onChange={handleFilterChange}
            >
              <option value="Select">--Select Status--</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="d-flex gap-8 mt-12">
            <button type="button" className="btn btn-danger-200 text-danger-600 w-100" onClick={handleResetFilters}>Reset</button>
            <button type="submit" className="btn btn-primary-600 w-100">Apply</button>
          </div>
        </form>
      </SlideSidebar>

      <WizardPopup
        modalWidth="560px"
        open={isCreateOpen}
        title="Create Head Office"
        steps={['Basic']}
        step={0}
        onClose={() => {
          setIsCreateOpen(false)
          setForm(buildEmptyForm())
        }}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        <div className="avm-grid">
          <FormField label="Head Office Name" required full>
             <input id="name" className="avm-input" value={form.name} onChange={handleChange} placeholder="Enter head office name" />
          </FormField>
          
          <FormField label="Status" required full>
            <select id="status" className="avm-input form-select" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </FormField>

          <FormField label="Head Office Admin Username" required full>
            <input id="adminUsername" className="avm-input" value={form.adminUsername} onChange={handleChange} placeholder="Enter admin username" />
          </FormField>

          <FormField label="Head Office Admin Password" required full>
            <input
              id="adminPassword"
              type="password"
              className="avm-input"
              value={form.adminPassword}
              onChange={handleChange}
              placeholder="Enter admin password"
            />
          </FormField>
        </div>
      </WizardPopup>

      <WizardPopup
        modalWidth="520px"
        open={isEditOpen}
        title="Update Head Office"
        steps={['Basic']}
        step={0}
        onClose={() => {
          setIsEditOpen(false)
          setEditId(null)
          setEditForm({ name: '', status: 'ACTIVE', adminUsername: '', adminPassword: '' })
        }}
        onSubmit={handleUpdate}
        submitLabel={updating ? 'Updating...' : 'Update'}
      >
        <div className="avm-grid">
          <FormField label="Head Office Name" required full>
            <input
              id="name"
              className="avm-input"
              value={editForm.name}
              onChange={handleEditChange}
              disabled={String(editForm.name || '').toUpperCase() === 'DEFAULT_HEAD_OFFICE'}
              placeholder="Enter head office name"
            />
          </FormField>

          <FormField label="Status" required full>
            <select id="status" className="avm-input form-select" value={editForm.status} onChange={handleEditChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </FormField>

          <FormField label="Admin Username" full>
            <input
              id="adminUsername"
              className="avm-input"
              value={editForm.adminUsername}
              onChange={handleEditChange}
              placeholder="Leave as-is or change"
            />
          </FormField>

          <FormField label="Admin Password" full>
            <input
              id="adminPassword"
              type="password"
              className="avm-input"
              value={editForm.adminPassword}
              onChange={handleEditChange}
              placeholder="Leave blank to keep current"
            />
          </FormField>
        </div>
      </WizardPopup>
    </div>
  )
}

export default HeadOffices
