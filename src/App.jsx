import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { SidebarProvider } from './context/SidebarContext'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <SidebarProvider>
      <Sidebar />

      <main className="dashboard-main">
        <Topbar />
        <Dashboard />
      </main>
    </SidebarProvider>
  )
}

export default App
