import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/css/remixicon.css'
import './css/oldcss/lib/bootstrap.min.css'
import './assets/css/style.css'
import './assets/css/core.css'
import './assets/css/sidebar.css'
import './assets/css/topbar.css'
import './assets/css/dashboard.css'
import './assets/css/table.css'
import './css/mobile-bottom-nav.css'
import './utils/pdfAutoTable.js'

import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
