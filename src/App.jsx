import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { SidebarProvider } from './context/SidebarContext'
import Dashboard from './pages/Dashboard'
import TeacherDepartment from './pages/TeacherDepartment'
import StudentList from './pages/StudentList'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'teacher-department':
        return <TeacherDepartment />
      case 'student-list':
        return <StudentList />
      default:
        return <Dashboard />
    }
  }

  return (
    <SidebarProvider>
      <Sidebar onNavigate={setCurrentPage} />

      <main className="dashboard-main">
        <Topbar />
        {renderPage()}
      </main>
    </SidebarProvider>
  )
}

export default App
