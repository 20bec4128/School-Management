import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const getChildId = (c) => c?.studentId ?? c?.id ?? c?.student?.id ?? null
const getChildName = (c) => c?.name ?? c?.studentName ?? c?.fullName ?? c?.student?.name ?? c?.student?.fullName ?? ''

export default function ParentChildSelect({ onDone }) {
  const { parentChildren, selectedChildId, setSelectedChildId } = useAuth()
  const [error, setError] = useState('')

  const children = useMemo(() => (Array.isArray(parentChildren) ? parentChildren : []), [parentChildren])
  const normalized = useMemo(
    () =>
      children
        .map((c) => ({ id: getChildId(c), name: getChildName(c), raw: c }))
        .filter((c) => c.id != null),
    [children],
  )

  useEffect(() => {
    if (normalized.length === 1 && !selectedChildId) {
      setSelectedChildId(normalized[0].id)
      onDone?.()
    }
  }, [normalized, selectedChildId, setSelectedChildId, onDone])

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Select Child</h1>
          <div className="text-secondary-light">Choose which child you want to view.</div>
        </div>
      </div>

      {error ? (
        <div className="card mb-16">
          <div className="card-body px-20 py-12 text-danger-600">{error}</div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-body p-20">
          {normalized.length === 0 ? (
            <div className="text-secondary-light">No children linked to this account.</div>
          ) : (
            <>
              <div className="mb-12 text-secondary-light">Children</div>
              <div className="list-group">
                {normalized.map((c) => (
                  <button
                    key={String(c.id)}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between${
                      String(selectedChildId) === String(c.id) ? ' active' : ''
                    }`}
                    onClick={() => setSelectedChildId(c.id)}
                  >
                    <span>{c.name || `Student ${c.id}`}</span>
                    <span className="text-muted">{c.id}</span>
                  </button>
                ))}
              </div>

              <div className="d-flex justify-content-end mt-16">
                <button
                  type="button"
                  className="btn btn-primary-600"
                  onClick={() => {
                    if (!selectedChildId) {
                      setError('Please select a child.')
                      return
                    }
                    setError('')
                    onDone?.()
                  }}
                  disabled={!selectedChildId}
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

