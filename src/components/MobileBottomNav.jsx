import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const tabs = [
  {
    key: 'dashboard',
    labelKey: 'bottomnav.dashboard',
    icon: 'ri:home-5-line',
  },
  {
    key: 'manage-teacher',
    labelKey: 'bottomnav.teachers',
    icon: 'ri:user-star-line',
  },
  {
    key: 'student-list',
    labelKey: 'bottomnav.students',
    icon: 'ri:group-line',
  },
]

const LANGUAGES = [
  { id: 'en', flag: 'https://flagcdn.com/w40/us.png', label: 'English' },
  { id: 'ja', flag: 'https://flagcdn.com/w40/jp.png', label: 'Japan' },
  { id: 'fr', flag: 'https://flagcdn.com/w40/fr.png', label: 'France' },
  { id: 'de', flag: 'https://flagcdn.com/w40/de.png', label: 'Germany' },
  { id: 'ko', flag: 'https://flagcdn.com/w40/kr.png', label: 'South Korea' },
  { id: 'bn', flag: 'https://flagcdn.com/w40/bd.png', label: 'Bangladesh' },
  { id: 'hi', flag: 'https://flagcdn.com/w40/in.png', label: 'India' },
  { id: 'en-CA', flag: 'https://flagcdn.com/w40/ca.png', label: 'Canada' },
]

const NOTIFICATIONS = [
  {
    id: 'verified',
    title: 'Congratulations',
    body: 'Your profile has been Verified.',
    time: '23 Mins ago',
    icon: { type: 'icon', name: 'bitcoin-icons:verify-outline', bg: 'success' },
  },
  {
    id: 'ronald',
    title: 'Ronald Richards',
    body: 'You can stitch between artboards',
    time: '23 Mins ago',
    icon: { type: 'img', src: '/assets/images/notification/profile-1.png', bg: 'success' },
  },
  {
    id: 'arlene',
    title: 'Arlene McCoy',
    body: 'Invite you to prototyping',
    time: '23 Mins ago',
    icon: { type: 'text', value: 'AM', bg: 'info' },
  },
]

const MobileBottomNav = ({ currentPage, onNavigate, onQuickAddStudent, onLogout }) => {
  const { t, i18n } = useTranslation()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [moreView, setMoreView] = useState('main') // main | language | notifications
  const [theme, setTheme] = useState('light')

  const handleNavigate = (page) => {
    setIsMoreOpen(false)
    setMoreView('main')
    onNavigate(page)
  }

  useEffect(() => {
    if (!isMoreOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMoreOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMoreOpen])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const initialTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light'
    setTheme(initialTheme)
    document.documentElement.dataset.theme = initialTheme
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Quick mobile navigation">
      {isMoreOpen ? (
        <button
          type="button"
          className="mobile-bottom-nav__backdrop"
          aria-label="Close menu"
          onClick={() => {
            setIsMoreOpen(false)
            setMoreView('main')
          }}
        />
      ) : null}

      <div className="mobile-bottom-nav__stack">
        <div className={`mobile-bottom-nav__sheet${isMoreOpen ? ' is-open' : ''}`} role="menu">
          {moreView !== 'main' ? (
            <button
              type="button"
              className="mobile-bottom-nav__sheet-item"
              role="menuitem"
              onClick={() => setMoreView('main')}
            >
              <iconify-icon icon="ri:arrow-left-line" className="mobile-bottom-nav__sheet-icon"></iconify-icon>
              <span>{t('common.back')}</span>
            </button>
          ) : null}

          {moreView === 'main' ? (
            <>
              <button
                type="button"
                className="mobile-bottom-nav__sheet-item"
                role="menuitem"
                onClick={toggleTheme}
              >
                <iconify-icon
                  icon={theme === 'dark' ? 'ri:sun-line' : 'ri:moon-line'}
                  className="mobile-bottom-nav__sheet-icon"
                ></iconify-icon>
                <span>{t('common.theme')}</span>
              </button>

              { <button
                type="button"
                className="mobile-bottom-nav__sheet-item"
                role="menuitem"
                onClick={() => setMoreView('language')}
              >
                <iconify-icon icon="ri:translate-2" className="mobile-bottom-nav__sheet-icon"></iconify-icon>
                <span>{t('common.language')}</span>
              </button> }

              <button
                type="button"
                className="mobile-bottom-nav__sheet-item"
                role="menuitem"
                onClick={() => setMoreView('notifications')}
              >
                <iconify-icon icon="iconoir:bell" className="mobile-bottom-nav__sheet-icon"></iconify-icon>
                <span>{t('common.notifications')}</span>
              </button>

              <div className="mobile-bottom-nav__sheet-divider" role="separator" aria-hidden="true" />

              <button
                type="button"
                className="mobile-bottom-nav__sheet-item"
                role="menuitem"
                onClick={() => setIsMoreOpen(false)}
              >
                <iconify-icon icon="ri:user-3-line" className="mobile-bottom-nav__sheet-icon"></iconify-icon>
                <span>{t('common.profile')}</span>
              </button>

              <button
                type="button"
                className="mobile-bottom-nav__sheet-item"
                role="menuitem"
                onClick={() => setIsMoreOpen(false)}
              >
                <iconify-icon icon="ri:settings-3-line" className="mobile-bottom-nav__sheet-icon"></iconify-icon>
                <span>{t('common.settings')}</span>
              </button>

              <button
                type="button"
                className="mobile-bottom-nav__sheet-item mobile-bottom-nav__sheet-item--danger"
                role="menuitem"
                onClick={() => {
                  setIsMoreOpen(false)
                  setMoreView('main')
                  onLogout?.()
                }}
              >
                <iconify-icon icon="ri:shut-down-line" className="mobile-bottom-nav__sheet-icon"></iconify-icon>
                <span>{t('common.logout')}</span>
              </button>
            </>
          ) : null}

          {moreView === 'language' ? (
            <div className="mobile-bottom-nav__sheet-scroll" role="none">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={`mobile-bottom-nav__sheet-item${(i18n.language || 'en').toLowerCase().startsWith(lang.id.toLowerCase()) ? ' is-selected' : ''}`}
                  role="menuitem"
                  onClick={() => {
                    i18n.changeLanguage(lang.id)
                    setMoreView('main')
                  }}
                >
                  <img src={lang.flag} alt={lang.label} className="mobile-bottom-nav__sheet-flag" />
                  <span>{lang.label}</span>
                  {(i18n.language || 'en').toLowerCase().startsWith(lang.id.toLowerCase()) ? (
                    <iconify-icon icon="ri:check-line" className="mobile-bottom-nav__sheet-check" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {moreView === 'notifications' ? (
            <div className="mobile-bottom-nav__sheet-scroll" role="none">
              {NOTIFICATIONS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="mobile-bottom-nav__sheet-item mobile-bottom-nav__sheet-item--notification"
                  role="menuitem"
                  onClick={() => setIsMoreOpen(false)}
                >
                  <span className={`mobile-bottom-nav__notif-icon mobile-bottom-nav__notif-icon--${n.icon.bg}`}>
                    {n.icon.type === 'icon' ? (
                      <iconify-icon icon={n.icon.name} className="mobile-bottom-nav__sheet-icon" />
                    ) : null}
                    {n.icon.type === 'img' ? <img src={n.icon.src} alt="" /> : null}
                    {n.icon.type === 'text' ? <span className="mobile-bottom-nav__notif-text">{n.icon.value}</span> : null}
                  </span>
                  <span className="mobile-bottom-nav__notif-body">
                    <span className="mobile-bottom-nav__notif-title">{n.title}</span>
                    <span className="mobile-bottom-nav__notif-desc">{n.body}</span>
                  </span>
                  <span className="mobile-bottom-nav__notif-time">{n.time}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="mobile-bottom-nav__fab"
          aria-label="Add Student"
          onClick={() => onQuickAddStudent?.()}
        >
          <iconify-icon icon="ri:add-line" className="mobile-bottom-nav__fab-icon" />
        </button>

        <div className="mobile-bottom-nav__inner">
        {tabs.map((tab) => {
          const isActive = currentPage === tab.key

          return (
            <button
              key={tab.key}
              type="button"
              className={`mobile-bottom-nav__item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleNavigate(tab.key)}
            >
              <iconify-icon icon={tab.icon} className="mobile-bottom-nav__icon"></iconify-icon>
              <span>{t(tab.labelKey)}</span>
            </button>
          )
        })}

        <button
          type="button"
          className={`mobile-bottom-nav__item mobile-bottom-nav__item--more${isMoreOpen ? ' is-active' : ''}`}
          aria-expanded={isMoreOpen}
          onClick={() => setIsMoreOpen((prev) => !prev)}
        >
          <iconify-icon icon="ri:menu-2-line" className="mobile-bottom-nav__icon"></iconify-icon>
          <span>{t('bottomnav.more')}</span>
        </button>
      </div>
      </div>
    </nav>
  )
}

export default MobileBottomNav
