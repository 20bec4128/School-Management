import { useEffect, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
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

const buildEmptyForm = () => ({
  name: '',
  status: 'ACTIVE',
  adminUsername: '',
  adminPassword: '',
})

const HeadOffices = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isSuperAdmin = getCurrentRole() === 'SUPER_ADMIN'

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState(buildEmptyForm)
  const [saving, setSaving] = useState(false)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', status: 'ACTIVE', adminUsername: '', adminPassword: '' })
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const page = await fetchHeadOfficesPage(0, 200)
      setRows(Array.isArray(page?.content) ? page.content : [])
    } catch (e) {
      setRows([])
      setError(e?.message || 'Failed to load head offices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

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
      // ignore: some head offices may not have an admin record
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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Head Offices</h4>
          <div className="text-muted small">Create head offices and head office admins.</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          Add Head Office
        </button>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card">
        <div className="card-body">
          {loading ? <div>Loading...</div> : null}
          {!loading ? (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>ID</th>
                    <th>Name</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: isSuperAdmin ? 320 : 220 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r?.id}>
                      <td>{r?.id}</td>
                      <td>{r?.name || '-'}</td>
                      <td>{r?.status || '-'}</td>
                      <td>
                        {String(r?.status || '').toUpperCase() === 'INACTIVE' ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivate(r)}
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeactivate(r)}
                            disabled={String(r?.status || '').toUpperCase() === 'INACTIVE'}
                          >
                            Deactivate
                          </button>
                        )}
                        <button type="button" className="btn btn-sm btn-outline-primary ms-2" onClick={() => openEdit(r)}>
                          Edit
                        </button>
                        {isSuperAdmin ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger ms-2"
                            onClick={() => handleDelete(r)}
                            disabled={
                              String(r?.status || '').toUpperCase() !== 'INACTIVE' ||
                              String(r?.name || '').toUpperCase() === 'DEFAULT_HEAD_OFFICE'
                            }
                            title={
                              String(r?.name || '').toUpperCase() === 'DEFAULT_HEAD_OFFICE'
                                ? 'Default head office cannot be deleted'
                                : String(r?.status || '').toUpperCase() !== 'INACTIVE'
                                  ? 'Deactivate before deleting'
                                  : 'Delete head office'
                            }
                          >
                            Delete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? <div className="text-muted">No head offices found.</div> : null}
            </div>
          ) : null}
        </div>
      </div>

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
        onBack={() => {}}
        onNext={() => {}}
        onSubmit={handleCreate}
        submitLabel={saving ? 'Saving...' : 'Save'}
      >
        <div className="avm-grid">
          <div className="avm-field full">
            <label className="avm-label" htmlFor="name">
              Head Office Name <span className="req">*</span>
            </label>
            <input id="name" className="avm-input" value={form.name} onChange={handleChange} />
          </div>
          <div className="avm-field full">
            <label className="avm-label" htmlFor="status">
              Status
            </label>
            <select id="status" className="avm-select" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="avm-field full">
            <label className="avm-label" htmlFor="adminUsername">
              Head Office Admin Username <span className="req">*</span>
            </label>
            <input id="adminUsername" className="avm-input" value={form.adminUsername} onChange={handleChange} />
          </div>
          <div className="avm-field full">
            <label className="avm-label" htmlFor="adminPassword">
              Head Office Admin Password <span className="req">*</span>
            </label>
            <input
              id="adminPassword"
              type="password"
              className="avm-input"
              value={form.adminPassword}
              onChange={handleChange}
            />
          </div>
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
        onBack={() => {}}
        onNext={() => {}}
        onSubmit={handleUpdate}
        submitLabel={updating ? 'Updating...' : 'Update'}
      >
        <div className="avm-grid">
          <div className="avm-field full">
            <label className="avm-label" htmlFor="name">
              Head Office Name <span className="req">*</span>
            </label>
            <input
              id="name"
              className="avm-input"
              value={editForm.name}
              onChange={handleEditChange}
              disabled={String(editForm.name || '').toUpperCase() === 'DEFAULT_HEAD_OFFICE'}
            />
          </div>
          <div className="avm-field full">
            <label className="avm-label" htmlFor="status">
              Status
            </label>
            <select id="status" className="avm-select" value={editForm.status} onChange={handleEditChange}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="avm-field full">
            <label className="avm-label" htmlFor="adminUsername">
              Admin Username
            </label>
            <input
              id="adminUsername"
              className="avm-input"
              value={editForm.adminUsername}
              onChange={handleEditChange}
              placeholder="Leave as-is or change"
            />
          </div>
          <div className="avm-field full">
            <label className="avm-label" htmlFor="adminPassword">
              Admin Password
            </label>
            <input
              id="adminPassword"
              type="password"
              className="avm-input"
              value={editForm.adminPassword}
              onChange={handleEditChange}
              placeholder="Leave blank to keep current"
            />
          </div>
        </div>
      </WizardPopup>
    </div>
  )
}

export default HeadOffices
