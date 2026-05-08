import { useEffect, useMemo, useState } from 'react'

const sampleNotifications = [
  {
    id: 'verified',
    title: 'Profile verified',
    body: 'Your account has been verified successfully.',
    time: '23m ago',
    icon: 'ri:shield-check-line',
  },
  {
    id: 'attendance',
    title: 'Attendance update',
    body: 'A new attendance record is ready for review.',
    time: '1h ago',
    icon: 'ri:calendar-check-line',
  },
  {
    id: 'routine',
    title: 'Routine changed',
    body: 'Your class routine was updated for tomorrow.',
    time: 'Today',
    icon: 'ri:time-line',
  },
]

const MobileProfileDrawer = ({
  open,
  onClose,
  title = 'Profile',
  subtitle,
  accent = 'school-admin',
  items = [],
  onNavigate,
  onLogout,
  theme = 'light',
  onToggleTheme,
}) => {
  const [view, setView] = useState('menu')

  useEffect(() => {
    if (!open) setView('menu')
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const visibleItems = useMemo(() => items.filter(Boolean), [items])

  if (!open) return null

  const handleItemClick = (item) => {
    if (!item) return

    if (item.kind === 'view') {
      setView(item.view || 'menu')
      return
    }

    if (item.kind === 'route' && item.page) {
      onNavigate?.(item.page)
      onClose?.()
      return
    }

    if (item.kind === 'action' && item.key === 'logout') {
      onLogout?.()
      onClose?.()
    }
  }

  const renderContent = () => {
    if (view === 'notifications') {
      return (
        <div className="mobile-profile-drawer__feed">
          {sampleNotifications.map((item) => (
            <article key={item.id} className="mobile-profile-drawer__card">
              <span className="mobile-profile-drawer__card-icon">
                <i className={item.icon} />
              </span>
              <div className="mobile-profile-drawer__card-body">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
              <span className="mobile-profile-drawer__card-time">{item.time}</span>
            </article>
          ))}
        </div>
      )
    }

    if (view === 'settings') {
      return (
        <div className="mobile-profile-drawer__settings">
          <button type="button" className="mobile-profile-drawer__setting-row" onClick={() => onToggleTheme?.()}>
            <span className="mobile-profile-drawer__setting-copy">
              <strong>Theme</strong>
              <span>{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</span>
            </span>
            <span className="mobile-profile-drawer__setting-action">
              <i className={theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
            </span>
          </button>
          <div className="mobile-profile-drawer__setting-note">
            Use the app theme toggle to switch instantly.
          </div>
        </div>
      )
    }

    return (
      <div className="mobile-profile-drawer__menu">
        {visibleItems.map((item) => {
          const isDanger = item.tone === 'danger'
          const isView = item.kind === 'view'

          return (
            <button
              key={item.key}
              type="button"
              className={`mobile-profile-drawer__item${isDanger ? ' is-danger' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="mobile-profile-drawer__item-icon">
                <i className={item.icon} />
              </span>
              <span className="mobile-profile-drawer__item-copy">
                <span>{item.label}</span>
                {isView && item.view === 'notifications' ? (
                  <small>Catch up on the latest alerts</small>
                ) : null}
              </span>
              {item.badgeCount > 0 ? (
                <span className="mobile-profile-drawer__badge">{item.badgeCount > 9 ? '9+' : item.badgeCount}</span>
              ) : (
                <span className="mobile-profile-drawer__chev">
                  <i className="ri-arrow-right-s-line" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mobile-profile-drawer" aria-hidden={!open}>
      <button type="button" className="mobile-profile-drawer__backdrop" aria-label="Close profile drawer" onClick={onClose} />
      <aside className={`mobile-profile-drawer__sheet is-open mobile-profile-drawer__sheet--${accent}`}>
        <div className="mobile-profile-drawer__handle" />
        <header className="mobile-profile-drawer__header">
          <div className="mobile-profile-drawer__identity">
            <span className="mobile-profile-drawer__avatar">
              <i className="ri-user-3-line" />
            </span>
            <div>
              <strong>{title}</strong>
              <span>{subtitle || 'Quick account actions'}</span>
            </div>
          </div>
          <button type="button" className="mobile-profile-drawer__close" aria-label="Close profile drawer" onClick={onClose}>
            <i className="ri-close-line" />
          </button>
        </header>

        <div className="mobile-profile-drawer__toolbar">
          <button
            type="button"
            className={view === 'menu' ? 'is-active' : ''}
            onClick={() => setView('menu')}
          >
            Menu
          </button>
          <button
            type="button"
            className={view === 'notifications' ? 'is-active' : ''}
            onClick={() => setView('notifications')}
          >
            Notifications
          </button>
          <button
            type="button"
            className={view === 'settings' ? 'is-active' : ''}
            onClick={() => setView('settings')}
          >
            Settings
          </button>
        </div>

        {renderContent()}
      </aside>
    </div>
  )
}

export default MobileProfileDrawer

