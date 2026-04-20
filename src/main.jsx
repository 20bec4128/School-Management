import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/css/remixicon.css'
import './css/oldcss/lib/bootstrap.min.css'
import './assets/css/style.css'
import './assets/css/sidebar.css'
import './assets/css/topbar.css'
import './assets/css/dashboard.css'
import './assets/css/table.css'
// import './assets/css/custom-table.css'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
