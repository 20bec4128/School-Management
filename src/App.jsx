import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { SidebarProvider } from './context/SidebarContext'
import Login from './pages/Login'
import AppRoute from './AppRoute'
import { useAuth } from './context/useAuth'
import { normalizeRole } from './utils/roles'

function App() {
  const { status, token, user, role, parentChildren, selectedChildId, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const homePage = useMemo(() => {
    const backendHome = user?.homePage
    if (typeof backendHome === 'string' && backendHome.trim()) {
      if (backendHome === 'parent-dashboard' || backendHome === 'parent-child-select') {
        const children = Array.isArray(parentChildren) ? parentChildren : []
        if (children.length > 1 && !selectedChildId) return 'parent-child-select'
        return 'parent-dashboard'
      }
      return backendHome
    }

    const r = normalizeRole(role)
    if (r === 'SUPER_ADMIN') return 'super-admin-dashboard'
    if (r === 'HEAD_OFFICE_ADMIN') return 'head-office-dashboard'
    if (r === 'SCHOOL_ADMIN') return 'school-admin-dashboard'
    if (r === 'TEACHER') return 'teacher-dashboard'
    if (r === 'STUDENT') return 'student-dashboard'
    if (r === 'PARENT') {
      const children = Array.isArray(parentChildren) ? parentChildren : []
      if (children.length > 1 && !selectedChildId) return 'parent-child-select'
      return 'parent-dashboard'
    }
    return 'dashboard'
  }, [role, parentChildren, selectedChildId, user?.homePage])

  useEffect(() => {
    if (status !== 'ready') return
    if (!token) {
      setCurrentPage('login')
      return
    }
    setCurrentPage((prev) => (prev === 'login' ? homePage : prev))
  }, [status, token, homePage])

  if (status !== 'ready') return null

  if (!token || currentPage === 'login') {
    return (
      <Login
        onSuccess={() => {
          setCurrentPage(homePage)
        }}
      />
    )
  }

  return (
    <SidebarProvider>
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} user={user} onLogout={logout} />

      <main className="dashboard-main">
        <Topbar user={user} onLogout={logout} />
        <AppRoute
          currentPage={currentPage}
          user={user}
          role={role}
          parentChildren={parentChildren}
          selectedChildId={selectedChildId}
          onNavigate={setCurrentPage}
        />
      </main>
    </SidebarProvider>
  )
}

export default App
