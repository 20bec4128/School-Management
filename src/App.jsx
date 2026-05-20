import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import MobileBottomNav from './components/MobileBottomNav'
import { useSidebar } from './context/SidebarContext'
import { SidebarProvider } from './context/SidebarContext'
import { SchoolProvider } from './context/SchoolContext'
import Login from './pages/Login'
import AppRoute from './AppRoute'
import { useAuth } from './context/useAuth'
import { normalizeRole } from './utils/roles'

const isBrowser = typeof window !== 'undefined'

const normalizePathPage = (pathname) => {
  if (!pathname) return null
  const page = pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
  return page || null
}

function App() {
  const { status, token, user, role, parentChildren, selectedChildId, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const homePage = useMemo(() => {
    const backendHome = user?.homePage
    if (typeof backendHome === 'string' && backendHome.trim()) {
      if (backendHome === 'parent-dashboard' || backendHome === 'parent-child-select') return 'parent-dashboard'
      return backendHome
    }

    const r = normalizeRole(role)
    if (r === 'SUPER_ADMIN') return 'lms-dashboard'
    if (r === 'HEAD_OFFICE_ADMIN') return 'head-office-dashboard'
    if (r === 'SCHOOL_ADMIN') return 'school-admin-dashboard'
    if (r === 'TEACHER') return 'teacher-dashboard'
    if (r === 'STUDENT') return 'student-dashboard'
    if (r === 'PARENT') {
      return 'parent-dashboard'
    }
    return 'dashboard'
  }, [role, parentChildren, selectedChildId, user?.homePage])

  const syncBrowserPath = (page) => {
    if (!isBrowser) return

    const nextPath = page && page !== homePage ? `/${page}` : '/'
    if (window.location.pathname === nextPath) return

    window.history.pushState({ page }, '', nextPath)
  }

  const handleNavigate = (page) => {
    if (!page) return
    setCurrentPage(page)
    syncBrowserPath(page)
  }

  useEffect(() => {
    if (status !== 'ready') return

    if (!token) {
      setCurrentPage('login')
      if (isBrowser && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/')
      }
      return
    }

    const pathPage = isBrowser ? normalizePathPage(window.location.pathname) : null
    const nextPage = pathPage || homePage

    setCurrentPage((prev) => {
      if (prev === 'login' || prev === 'dashboard') return nextPage
      return prev
    })
  }, [status, token, homePage])

  useEffect(() => {
    if (status !== 'ready' || !token || !isBrowser) return undefined

    const handlePopState = () => {
      const pathPage = normalizePathPage(window.location.pathname)
      setCurrentPage(pathPage || homePage)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [status, token, homePage])

  if (status !== 'ready') return null

  if (!token || currentPage === 'login') {
    return (
      <Login
        onSuccess={() => {
          setCurrentPage(homePage)
          syncBrowserPath(homePage)
        }}
      />
    )
  }

  return (
    <SchoolProvider user={user}>
      <SidebarProvider>
        <AppLayout
          user={user}
          role={role}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          parentChildren={parentChildren}
          selectedChildId={selectedChildId}
          logout={logout}
        />
      </SidebarProvider>
    </SchoolProvider>
  )
}

function AppLayout({
  user,
  role,
  currentPage,
  onNavigate,
  parentChildren,
  selectedChildId,
  logout,
}) {
  const { isCollapsed } = useSidebar()

  return (
    <>
      <Sidebar onNavigate={onNavigate} currentPage={currentPage} user={user} onLogout={logout} />

      <main className={`dashboard-main ${isCollapsed ? 'active' : ''}`}>
        <Topbar user={user} />
        <AppRoute
          currentPage={currentPage}
          user={user}
          role={role}
          parentChildren={parentChildren}
          selectedChildId={selectedChildId}
          onNavigate={onNavigate}
        />
      </main>

      <MobileBottomNav currentPage={currentPage} onNavigate={onNavigate} onLogout={logout} />
    </>
  )
}

export default App
