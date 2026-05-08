import '../css/topbar.css'
import { useSidebar } from '../context/SidebarContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { normalizeRole } from '../utils/roles'

const Topbar = ({ user }) => {
  const { toggleSidebar } = useSidebar()
  const { parentChildren, selectedChildId, setSelectedChildId } = useAuth()
  const { activeSchoolId, setActiveSchoolId, schoolOptions, isSchoolSelectionEnabled } = useSchool()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const pickerInputRef = useRef(null)
  const pickerShellRef = useRef(null)

  const role = normalizeRole(user?.role || user?.userRole || user?.authority)

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') setPickerOpen(false)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!pickerOpen) return undefined

    const onPointerDown = (event) => {
      if (pickerShellRef.current && !pickerShellRef.current.contains(event.target)) {
        setPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [pickerOpen])

  useEffect(() => {
    if (pickerOpen) pickerInputRef.current?.focus?.()
  }, [pickerOpen])

  useEffect(() => {
    setPickerOpen(false)
    setPickerQuery('')
  }, [role])

  const selectorMode = role === 'HEAD_OFFICE_ADMIN' ? 'school' : role === 'PARENT' ? 'child' : null

  const childOptions = useMemo(() => {
    const children = Array.isArray(parentChildren) ? parentChildren : []
    return children
      .map((child) => {
        const id = child?.studentId ?? child?.id ?? child?.student?.id ?? null
        const label = child?.name ?? child?.studentName ?? child?.fullName ?? child?.student?.name ?? child?.student?.fullName ?? ''
        return id == null ? null : { id: String(id), label, raw: child }
      })
      .filter(Boolean)
  }, [parentChildren])

  const schoolLabelById = useMemo(() => {
    const map = new Map()
    schoolOptions.forEach((school) => {
      const id = school?.id ?? school?.schoolId ?? null
      const label = school?.schoolName ?? school?.name ?? school?.label ?? `School ${id ?? ''}`.trim()
      if (id != null) map.set(String(id), label)
    })
    return map
  }, [schoolOptions])

  const currentSelectionLabel =
    selectorMode === 'school'
      ? (activeSchoolId ? schoolLabelById.get(String(activeSchoolId)) : 'All schools')
      : selectorMode === 'child'
        ? (childOptions.find((child) => String(child.id) === String(selectedChildId))?.label || 'Select child')
        : ''

  const filteredSchools = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase()
    return schoolOptions
      .map((school) => {
        const id = school?.id ?? school?.schoolId ?? null
        if (id == null) return null
        const label = school?.schoolName ?? school?.name ?? school?.label ?? `School ${id}`
        return { id: String(id), label, raw: school }
      })
      .filter(Boolean)
      .filter((school) => !query || school.label.toLowerCase().includes(query))
  }, [pickerQuery, schoolOptions])

  const filteredChildren = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase()
    return childOptions.filter((child) => !query || child.label.toLowerCase().includes(query))
  }, [childOptions, pickerQuery])

  const handleSelectSchool = (schoolId) => {
    setActiveSchoolId(schoolId)
    setPickerOpen(false)
    setPickerQuery('')
  }

  const handleSelectChild = (childId) => {
    setSelectedChildId(childId)
    setPickerOpen(false)
    setPickerQuery('')
  }

  const renderPickerList = () => {
    if (selectorMode === 'school') {
      return (
        <div className="sm-topbar__picker-list" role="listbox" aria-label="Schools">
          <button
            type="button"
            className={`sm-topbar__picker-item${!activeSchoolId ? ' is-active' : ''}`}
            onClick={() => handleSelectSchool(null)}
          >
            <span className="sm-topbar__picker-item-icon">
              <i className="ri-global-line" />
            </span>
            <span className="sm-topbar__picker-item-copy">
              <strong>All schools</strong>
              <small>Show data across every school</small>
            </span>
          </button>

          {filteredSchools.map((school) => (
            <button
              key={school.id}
              type="button"
              className={`sm-topbar__picker-item${String(activeSchoolId) === String(school.id) ? ' is-active' : ''}`}
              onClick={() => handleSelectSchool(school.id)}
            >
              <span className="sm-topbar__picker-item-icon">
                <i className="ri-school-line" />
              </span>
              <span className="sm-topbar__picker-item-copy">
                <strong>{school.label}</strong>
                <small>ID {school.id}</small>
              </span>
            </button>
          ))}

          {filteredSchools.length === 0 ? (
            <div className="sm-topbar__picker-empty">No schools found.</div>
          ) : null}
        </div>
      )
    }

    if (selectorMode === 'child') {
      return (
        <div className="sm-topbar__picker-list" role="listbox" aria-label="Children">
          {filteredChildren.map((child) => (
            <button
              key={child.id}
              type="button"
              className={`sm-topbar__picker-item${String(selectedChildId) === String(child.id) ? ' is-active' : ''}`}
              onClick={() => handleSelectChild(child.id)}
            >
              <span className="sm-topbar__picker-item-icon">
                <i className="ri-user-3-line" />
              </span>
              <span className="sm-topbar__picker-item-copy">
                <strong>{child.label || `Student ${child.id}`}</strong>
                <small>ID {child.id}</small>
              </span>
            </button>
          ))}

          {filteredChildren.length === 0 ? (
            <div className="sm-topbar__picker-empty">No child found.</div>
          ) : null}
        </div>
      )
    }

    return null
  }

  return (
    <div className="navbar-header sm-topbar">
      <div className="row align-items-center justify-content-between g-2">
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button type="button" className="sidebar-mobile-toggle" aria-label="Sidebar Mobile Toggler Button" onClick={toggleSidebar}>
              <iconify-icon icon="heroicons:bars-3-solid" className="icon"></iconify-icon>
            </button>

            {selectorMode ? (
              <div className="sm-topbar__search-shell" ref={pickerShellRef}>
                <button
                  type="button"
                  className="sm-topbar__search-toggle"
                  aria-label={selectorMode === 'school' ? 'Select school' : 'Select child'}
                  aria-expanded={pickerOpen}
                  onClick={() => setPickerOpen((prev) => !prev)}
                >
                  <iconify-icon icon="ri-search-line" className="text-primary-light text-xl"></iconify-icon>
                </button>

                <div className={`sm-topbar__search ${pickerOpen ? 'is-open' : ''}`}>
                  <div className="sm-topbar__search-header">
                    <div className="sm-topbar__search-title">
                      <strong>{selectorMode === 'school' ? 'Select School' : 'Select Child'}</strong>
                      <span>{currentSelectionLabel || 'Choose from the list'}</span>
                    </div>
                    <button type="button" className="sm-topbar__search-close" aria-label="Close selector" onClick={() => setPickerOpen(false)}>
                      <iconify-icon icon="ri-close-line" />
                    </button>
                  </div>

                  <div className="sm-topbar__search-input-wrap">
                    <iconify-icon icon="ri-search-line" className="sm-topbar__search-input-icon" />
                    <input
                      ref={pickerInputRef}
                      type="text"
                      className="bg-transparent"
                      name="search"
                      placeholder={selectorMode === 'school' ? 'Search schools' : 'Search child'}
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                    />
                  </div>

                  {isSchoolSelectionEnabled || selectorMode === 'child' ? renderPickerList() : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-auto">
          <a href="#" className="sm-topbar__brand sm-topbar__brand--right" aria-label="School Management">
            <img src="/assets/images/logo-icon.png" alt="School Management" className="sm-topbar__logo" />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Topbar
