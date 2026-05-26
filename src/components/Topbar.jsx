import '../css/topbar.css'
import { useSidebar } from '../context/SidebarContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSchool } from '../context/useSchool'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import ParentChildSelector from './ParentChildSelector'

const notificationItems = [
  {
    id: 'verified',
    title: 'Profile verified',
    body: 'Your account has been verified successfully.',
    time: '23m ago',
    icon: 'ri-shield-check-line',
  },
  {
    id: 'attendance',
    title: 'Attendance update',
    body: 'A new attendance record is ready for review.',
    time: '1h ago',
    icon: 'ri-calendar-check-line',
  },
  {
    id: 'routine',
    title: 'Routine changed',
    body: 'Your class routine was updated for tomorrow.',
    time: 'Today',
    icon: 'ri-time-line',
  },
]

const readTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem('theme')
  return saved === 'dark' || saved === 'light' ? saved : document.documentElement.dataset.theme || 'light'
}

const Topbar = ({ user }) => {
  const { toggleSidebar } = useSidebar()
  const { logout } = useAuth()
  const {
    activeSchoolId,
    setActiveSchoolId,
    schoolOptions,
  } = useSchool()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [theme, setTheme] = useState(readTheme)
  const [openMenu, setOpenMenu] = useState('none')
  const [desktopReady, setDesktopReady] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(min-width: 992px)').matches
  })
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const pickerInputRef = useRef(null)
  const pickerShellRef = useRef(null)
  const webToolbarRef = useRef(null)
  const [logoutBusy, setLogoutBusy] = useState(false)

  const role = normalizeRole(user?.role || user?.userRole || user?.authority)
  const isParent = role === 'PARENT'
  const isHeadOfficeAdmin = role === 'HEAD_OFFICE_ADMIN'

  const isWebView =
    typeof window !== 'undefined' &&
    (Boolean(window.ReactNativeWebView) || /WebView|wv/i.test(window.navigator?.userAgent || ''))
  const isDesktopWebView = desktopReady

  const handleLogout = async () => {
    if (logoutBusy) return
    setLogoutBusy(true)
    try {
      await logout()
    } finally {
      setOpenMenu('none')
      setLogoutBusy(false)
    }
  }

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') {
        setPickerOpen(false)
        setOpenMenu('none')
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const media = window.matchMedia('(min-width: 992px)')
    const onChange = (event) => setDesktopReady(event.matches)

    setDesktopReady(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
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
    if (openMenu === 'none') return undefined

    const onPointerDown = (event) => {
      if (webToolbarRef.current && !webToolbarRef.current.contains(event.target)) {
        setOpenMenu('none')
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [openMenu])

  useEffect(() => {
    if (pickerOpen) pickerInputRef.current?.focus?.()
  }, [pickerOpen])

  useEffect(() => {
    setPickerOpen(false)
    setPickerQuery('')
    setOpenMenu('none')
  }, [role])

  useEffect(() => {
    const nextTheme = readTheme()
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }, [])

  const selectorMode = null

  const schoolLabelById = useMemo(() => {
    const map = new Map()
    schoolOptions.forEach((school) => {
      const id = school?.id ?? school?.schoolId ?? null
      const label = school?.schoolName ?? school?.name ?? school?.label ?? `School ${id ?? ''}`.trim()
      if (id != null) map.set(String(id), label)
    })
    return map
  }, [schoolOptions])

  const _currentSelectionLabel =
    selectorMode === 'school'
      ? (activeSchoolId ? schoolLabelById.get(String(activeSchoolId)) : 'All schools')
    : ''

  const handleSchoolSelectChange = (event) => {
    const value = event.target.value
    setActiveSchoolId(value || null)
  }

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

  const handleSelectSchool = (schoolId) => {
    setActiveSchoolId(schoolId)
    setPickerOpen(false)
    setPickerQuery('')
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  }

  const _renderPickerList = () => {
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

    return null
  }

  const webToolbar = isDesktopWebView ? (
    <div className="sm-topbar__desktop-tools" ref={webToolbarRef}>
      {isParent ? (
        <ParentChildSelector showLabel={false} variant="topbar" />
      ) : null}

      <div className="sm-topbar__search-shell sm-topbar__search-shell--desktop">
        <span className="sm-topbar__search-icon">
          <iconify-icon icon="ri-search-line" />
        </span>
        <input
          type="search"
          className="sm-topbar__search-input"
          placeholder="Search..."
          aria-label="Search"
          value={webSearchQuery}
          onChange={(event) => setWebSearchQuery(event.target.value)}
        />
      </div>

      <div className="sm-topbar__actions">
        <div className="dropdown">
          <button
            type="button"
            className="sm-topbar__action-btn"
            aria-label="Notifications"
            aria-expanded={openMenu === 'notifications'}
            onClick={() => setOpenMenu((prev) => (prev === 'notifications' ? 'none' : 'notifications'))}
          >
            <i className="ri-notification-3-line" />
            <span className="sm-topbar__badge">3</span>
          </button>

          {openMenu === 'notifications' ? (
            <div className="sm-topbar__menu sm-topbar__menu--wide">
              <div className="sm-topbar__menu-header">
                <strong>Notifications</strong>
                <span>Latest activity</span>
              </div>
              <div className="sm-topbar__menu-list">
                {notificationItems.map((item) => (
                  <article key={item.id} className="sm-topbar__menu-card">
                    <span className="sm-topbar__menu-card-icon">
                      <i className={item.icon} />
                    </span>
                    <div className="sm-topbar__menu-card-copy">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                    <span className="sm-topbar__menu-card-time">{item.time}</span>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="sm-topbar__action-btn"
          aria-label="Theme"
          onClick={toggleTheme}
        >
          <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
        </button>

        <div className="dropdown">
          <button
            type="button"
            className="sm-topbar__action-btn"
            aria-label="Profile"
            aria-expanded={openMenu === 'profile'}
            onClick={() => setOpenMenu((prev) => (prev === 'profile' ? 'none' : 'profile'))}
          >
            <i className="ri-user-3-line" />
          </button>

          {openMenu === 'profile' ? (
            <div className="sm-topbar__menu sm-topbar__menu--compact" style={{ minWidth: '14rem' }}>
              <div className="sm-topbar__menu-header">
                <strong>Profile</strong>
                <span>Account actions</span>
              </div>
              <div className="sm-topbar__menu-list">
                <button
                  type="button"
                  className="sm-topbar__menu-card w-100 text-start border-0 bg-transparent"
                  onClick={handleLogout}
                  disabled={logoutBusy}
                >
                  <span className="sm-topbar__menu-card-icon">
                    <i className="ri-logout-box-r-line" />
                  </span>
                  <div className="sm-topbar__menu-card-copy">
                    <strong>{logoutBusy ? 'Logging out...' : 'Logout'}</strong>
                    <p>Sign out of this session</p>
                  </div>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  ) : null

  if (isDesktopWebView) {
    return (
      <div className="navbar-header sm-topbar sm-topbar--desktop">
        <div className="sm-topbar__desktop-row">
          <button type="button" className="sidebar-mobile-toggle" aria-label="Sidebar Mobile Toggler Button" onClick={toggleSidebar}>
            <iconify-icon icon="heroicons:bars-3-solid" className="icon"></iconify-icon>
          </button>

          {webToolbar}
        </div>
      </div>
    )
  }

  return (
    <div className="navbar-header sm-topbar">
      <div className="sm-topbar__mobile-row">
        <button type="button" className="sidebar-mobile-toggle" aria-label="Sidebar Mobile Toggler Button" onClick={toggleSidebar}>
          <iconify-icon icon="heroicons:bars-3-solid" className="icon"></iconify-icon>
        </button>

      <div className="sm-topbar__mobile-actions">
          {selectorMode ? (
            selectorMode === 'school' && isWebView ? (
              <div className="sm-topbar__search-shell sm-topbar__search-shell--mobile" ref={pickerShellRef}>
                <select
                  className="form-select form-select-sm border border-neutral-300 radius-8 text-secondary-light sm-topbar__mobile-select"
                  value={activeSchoolId || ''}
                  onChange={handleSchoolSelectChange}
                  aria-label="Select school"
                >
                  <option value="">All schools</option>
                  {schoolOptions.map((school) => {
                    const id = school?.id ?? school?.schoolId ?? null
                    if (id == null) return null
                    const label = school?.schoolName ?? school?.name ?? school?.label ?? `School ${id}`
                    return (
                      <option key={String(id)} value={String(id)}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>
            ) : null
          ) : isParent ? (
            <ParentChildSelector showLabel={false} variant="topbar" />
          ) : null}

          <a href="#" className="sm-topbar__brand sm-topbar__brand--right sm-topbar__brand--mobile" aria-label="School Management">
            <img src="/assets/images/logo-icon.png" alt="School Management" className="sm-topbar__logo" />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Topbar
