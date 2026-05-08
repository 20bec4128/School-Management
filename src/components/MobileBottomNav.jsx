import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { normalizeRole } from '../utils/roles'
import MobileProfileDrawer from './MobileProfileDrawer'
import { getMobileNavigationConfig } from './mobileNavigationConfig'

const themeState = () => {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem('theme')
  return saved === 'dark' || saved === 'light' ? saved : document.documentElement.dataset.theme || 'light'
}

const MobileBottomNav = ({ currentPage, onNavigate, onLogout }) => {
  const { user, role } = useAuth()
  const [activePanel, setActivePanel] = useState('none') // none | profile | actions
  const [theme, setTheme] = useState(themeState)

  useEffect(() => {
    const saved = themeState()
    setTheme(saved)
    document.documentElement.dataset.theme = saved
  }, [])

  useEffect(() => {
    if (activePanel === 'none') return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActivePanel('none')
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePanel])

  useEffect(() => {
    if (activePanel === 'none') return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [activePanel])

  const nav = useMemo(() => getMobileNavigationConfig({ user, role }), [role, user])

  const roleLabel = normalizeRole(role || user?.role || user?.userRole || user?.authority).replaceAll('_', ' ')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  }

  const handleNavigate = (page) => {
    if (!page) return
    setActivePanel('none')
    onNavigate?.(page)
  }

  const handleQuickAction = (page) => {
    if (!page) return
    setActivePanel('none')
    onNavigate?.(page)
  }

  const visibleTabs = nav.tabs.filter(Boolean).slice(0, 5)
  const profileTab = visibleTabs.find((tab) => tab.key === 'profile')
  const tabs = visibleTabs.filter((tab) => tab.key !== 'profile')
  const hasFab = nav.quickActions.length > 0
  const isProfileOpen = activePanel === 'profile'
  const isActionsOpen = activePanel === 'actions'

  const visibleActionTabs = nav.quickActions.slice(0, 4)
  const centerAction = nav.centerAction
  const leftTabs = centerAction ? tabs.slice(0, 2) : tabs
  const rightTabs = centerAction ? visibleTabs.slice(-2) : visibleTabs.filter((tab) => tab.key === 'profile')

  return (
    <nav
      className={`mobile-bottom-nav is-${nav.accent}`}
      data-mobile-nav-role={nav.accent}
      aria-label="Mobile navigation"
    >
      {isActionsOpen ? (
        <button
          type="button"
          className="mobile-bottom-nav__backdrop"
          aria-label="Close mobile menu"
          onClick={() => setActivePanel('none')}
        />
      ) : null}

      <div className="mobile-bottom-nav__dock">
        <div className="mobile-bottom-nav__surface">
          <div className="mobile-bottom-nav__glow" />
          <div
            className={`mobile-bottom-nav__inner${centerAction ? ' has-center-action' : ''}`}
            style={{
              gridTemplateColumns: centerAction
                ? 'repeat(5, minmax(0, 1fr))'
                : `repeat(${Math.max(1, tabs.length + (profileTab ? 1 : 0))}, minmax(0, 1fr))`,
            }}
          >
            {leftTabs.map((tab) => {
              const isActive = currentPage === tab.page

              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`mobile-bottom-nav__item${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavigate(tab.page)}
                >
                  <span className="mobile-bottom-nav__icon-wrap">
                    <i className={tab.icon} />
                    {tab.badgeCount > 0 ? (
                      <span className="mobile-bottom-nav__badge">{tab.badgeCount > 9 ? '9+' : tab.badgeCount}</span>
                    ) : null}
                  </span>
                  <span className="mobile-bottom-nav__label">{tab.label}</span>
                </button>
              )
            })}

            {centerAction ? (
              <button
                type="button"
                className={`mobile-bottom-nav__item mobile-bottom-nav__item--center${isActionsOpen ? ' is-active' : ''}`}
                aria-expanded={isActionsOpen}
                onClick={() => setActivePanel((prev) => (prev === 'actions' ? 'none' : 'actions'))}
              >
                <span className="mobile-bottom-nav__icon-wrap mobile-bottom-nav__icon-wrap--center">
                  <span className="mobile-bottom-nav__plus" aria-hidden="true">+</span>
                </span>
                <span className="mobile-bottom-nav__label">{centerAction.label}</span>
              </button>
            ) : null}

            {rightTabs.map((tab) => {
              const isActive = currentPage === tab.page

              if (tab.key === 'profile') {
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`mobile-bottom-nav__item mobile-bottom-nav__item--profile${isProfileOpen ? ' is-active' : ''}`}
                    aria-expanded={isProfileOpen}
                    onClick={() => setActivePanel((prev) => (prev === 'profile' ? 'none' : 'profile'))}
                  >
                    <span className="mobile-bottom-nav__icon-wrap">
                      <i className={tab.icon} />
                      {tab.badgeCount > 0 ? (
                        <span className="mobile-bottom-nav__badge">{tab.badgeCount > 9 ? '9+' : tab.badgeCount}</span>
                      ) : null}
                    </span>
                    <span className="mobile-bottom-nav__label">{tab.label}</span>
                  </button>
                )
              }

              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`mobile-bottom-nav__item${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavigate(tab.page)}
                >
                  <span className="mobile-bottom-nav__icon-wrap">
                    <i className={tab.icon} />
                    {tab.badgeCount > 0 ? (
                      <span className="mobile-bottom-nav__badge">{tab.badgeCount > 9 ? '9+' : tab.badgeCount}</span>
                    ) : null}
                  </span>
                  <span className="mobile-bottom-nav__label">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {centerAction && isActionsOpen ? (
            <div className="mobile-bottom-nav__actions mobile-bottom-nav__actions--center is-open">
              {visibleActionTabs.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className="mobile-bottom-nav__action"
                  onClick={() => handleQuickAction(action.page)}
                >
                  <span className="mobile-bottom-nav__action-icon">
                    <i className={action.icon} />
                  </span>
                  <span>
                    <strong>{action.label}</strong>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {!centerAction && hasFab ? (
            <div className="mobile-bottom-nav__fab-zone">
              <button
                type="button"
                className={`mobile-bottom-nav__fab${isActionsOpen ? ' is-open' : ''}`}
                aria-label="Create action menu"
                aria-expanded={isActionsOpen}
                onClick={() => setActivePanel((prev) => (prev === 'actions' ? 'none' : 'actions'))}
              >
                <i className={isActionsOpen ? 'ri-close-line' : 'ri-add-line'} />
              </button>

              <div className={`mobile-bottom-nav__actions${isActionsOpen ? ' is-open' : ''}`}>
                {visibleActionTabs.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    className="mobile-bottom-nav__action"
                    onClick={() => handleQuickAction(action.page)}
                  >
                    <span className="mobile-bottom-nav__action-icon">
                      <i className={action.icon} />
                    </span>
                    <span>
                      <strong>{action.label}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <MobileProfileDrawer
        open={isProfileOpen}
        onClose={() => setActivePanel('none')}
        title={roleLabel}
        subtitle={user?.name || user?.fullName || user?.username || user?.email || 'Mobile profile'}
        accent={nav.accent}
        items={nav.profileItems}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </nav>
  )
}

export default MobileBottomNav
