import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'
import ExportDropdown from '../components/ExportDropdown'

const paymentSettingData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    paypal: 'info@windsorpark.edu',
    payUMoney: 'payu_windsor',
    ccaVenue: 'ccav_windsor',
    payTM: 'paytm_windsor',
    payStack: 'psk_windsor',
  },
  {
    sl: '02',
    school: 'Riverside Academy',
    paypal: 'info@riverside.edu',
    payUMoney: 'payu_riverside',
    ccaVenue: 'ccav_riverside',
    payTM: 'paytm_riverside',
    payStack: 'psk_riverside',
  },
  {
    sl: '03',
    school: 'Sunrise Public School',
    paypal: 'info@sunrise.edu',
    payUMoney: 'payu_sunrise',
    ccaVenue: 'ccav_sunrise',
    payTM: 'paytm_sunrise',
    payStack: 'psk_sunrise',
  },
  {
    sl: '04',
    school: 'Green Valley School',
    paypal: 'info@greenvalley.edu',
    payUMoney: 'payu_greenvalley',
    ccaVenue: 'ccav_greenvalley',
    payTM: 'paytm_greenvalley',
    payStack: 'psk_greenvalley',
  },
  {
    sl: '05',
    school: 'Hilltop Academy',
    paypal: 'info@hilltop.edu',
    payUMoney: 'payu_hilltop',
    ccaVenue: 'ccav_hilltop',
    payTM: 'paytm_hilltop',
    payStack: 'psk_hilltop',
  },
]

// PayPal Form
const emptyPaypalForm = {
  gateway: 'PayPal',
  school: '',
  paypalEmail: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// Stripe Form
const emptyStripeForm = {
  gateway: 'Stripe',
  school: '',
  secretKey: '',
  publishableKey: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// PayUMoney Form
const emptyPayUMoneyForm = {
  gateway: 'PayUMoney',
  school: '',
  payumoneyKey: '',
  keySalt: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// CCAvenue Form
const emptyCCAvenueForm = {
  gateway: 'CCAvenue',
  school: '',
  merchantId: '',
  workingKey: '',
  accessCode: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// PayTM Form
const emptyPayTMForm = {
  gateway: 'PayTM',
  school: '',
  merchantKey: '',
  merchantMid: '',
  website: '',
  industryType: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// PayStack Form
const emptyPayStackForm = {
  gateway: 'PayStack',
  school: '',
  secretKey: '',
  publicKey: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// Jazz Cash Form
const emptyJazzCashForm = {
  gateway: 'JazzCash',
  school: '',
  merchantId: '',
  password: '',
  keySalt: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// SSL Commerz Form
const emptySSLCommerzForm = {
  gateway: 'SSLCommerz',
  school: '',
  storeId: '',
  password: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// DBBL Form
const emptyDBBLForm = {
  gateway: 'DBBL',
  school: '',
  userId: '',
  password: '',
  submerName: '',
  submerId: '',
  terminalId: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// Midtrans Form
const emptyMidtransForm = {
  gateway: 'Midtrans',
  school: '',
  clientKey: '',
  serverKey: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// Insta Mojo Form
const emptyInstaMojoForm = {
  gateway: 'InstaMojo',
  school: '',
  apiKey: '',
  authToken: '',
  keySalt: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// Flutter Wave Form
const emptyFlutterWaveForm = {
  gateway: 'FlutterWave',
  school: '',
  publicKey: '',
  secretKey: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

// iPay Form
const emptyIpayForm = {
  gateway: 'iPay',
  school: '',
  vendorId: '',
  hashKey: '',
  isDemo: 'Yes',
  extraCharge: '',
  isActive: 'Select',
}

const emptyFilters = {
  school: 'Select',
  gateway: 'Select',
}

const STEPS = ['Payment Gateway Settings']

const gatewayOptions = [
  'PayPal', 'Stripe', 'PayUMoney', 'CCAvenue', 'PayTM', 'PayStack',
  'JazzCash', 'SSLCommerz', 'DBBL', 'Midtrans', 'InstaMojo', 'FlutterWave', 'iPay'
]

const isActiveOptions = ['Select', 'Yes', 'No']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Gateway': 'ri-wallet-line',
  'Paypal Email': 'ri-mail-line',
  'Is Demo?': 'ri-flask-line',
  'Extra Charge (%)': 'ri-percent-line',
  'Is Active?': 'ri-checkbox-circle-line',
  'Secret Key': 'ri-key-line',
  'Publishable Key': 'ri-lock-line',
  'Payumoney Key': 'ri-key-line',
  'Key Salt': 'ri-salt-line',
  'Merchant ID': 'ri-store-line',
  'Working Key': 'ri-settings-line',
  'Access Code': 'ri-qr-code-line',
  'Merchant Key': 'ri-key-line',
  'Merchant MID': 'ri-id-card-line',
  'Website': 'ri-global-line',
  'Industry Type': 'ri-bank-line',
  'Public Key': 'ri-key-line',
  'Password': 'ri-lock-password-line',
  'Store ID': 'ri-store-line',
  'User ID': 'ri-user-line',
  'Submer Name': 'ri-building-line',
  'Submer ID': 'ri-id-card-line',
  'Terminal ID': 'ri-terminal-line',
  'Client Key': 'ri-key-line',
  'Server Key': 'ri-server-line',
  'Api Key': 'ri-api-line',
  'Auth Token': 'ri-token-line',
  'Hash Key': 'ri-key-line',
  'Vendor ID': 'ri-store-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'paypal', label: 'PayPal' },
  { key: 'payUMoney', label: 'PayUMoney' },
  { key: 'ccaVenue', label: 'CCAvenue' },
  { key: 'payTM', label: 'PayTM' },
  { key: 'payStack', label: 'PayStack' },
]

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || 'ri-edit-line'
  return (
    <div className={`avm-field${full ? ' full' : ''}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {!noIcon ? (
        <div className="avm-input-with-icon" style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667085',
              fontSize: '0.95rem',
              lineHeight: 1,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <i className={icon}></i>
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

const PaymentSetting = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState('PayPal')
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)
  
  // Form states for each gateway
  const [addPaypalForm, setAddPaypalForm] = useState(emptyPaypalForm)
  const [addStripeForm, setAddStripeForm] = useState(emptyStripeForm)
  const [addPayUMoneyForm, setAddPayUMoneyForm] = useState(emptyPayUMoneyForm)
  const [addCCAvenueForm, setAddCCAvenueForm] = useState(emptyCCAvenueForm)
  const [addPayTMForm, setAddPayTMForm] = useState(emptyPayTMForm)
  const [addPayStackForm, setAddPayStackForm] = useState(emptyPayStackForm)
  const [addJazzCashForm, setAddJazzCashForm] = useState(emptyJazzCashForm)
  const [addSSLCommerzForm, setAddSSLCommerzForm] = useState(emptySSLCommerzForm)
  const [addDBBLForm, setAddDBBLForm] = useState(emptyDBBLForm)
  const [addMidtransForm, setAddMidtransForm] = useState(emptyMidtransForm)
  const [addInstaMojoForm, setAddInstaMojoForm] = useState(emptyInstaMojoForm)
  const [addFlutterWaveForm, setAddFlutterWaveForm] = useState(emptyFlutterWaveForm)
  const [addIpayForm, setAddIpayForm] = useState(emptyIpayForm)
  
  const [editPaypalForm, setEditPaypalForm] = useState(emptyPaypalForm)
  const [editStripeForm, setEditStripeForm] = useState(emptyStripeForm)
  const [editPayUMoneyForm, setEditPayUMoneyForm] = useState(emptyPayUMoneyForm)
  const [editCCAvenueForm, setEditCCAvenueForm] = useState(emptyCCAvenueForm)
  const [editPayTMForm, setEditPayTMForm] = useState(emptyPayTMForm)
  const [editPayStackForm, setEditPayStackForm] = useState(emptyPayStackForm)
  const [editJazzCashForm, setEditJazzCashForm] = useState(emptyJazzCashForm)
  const [editSSLCommerzForm, setEditSSLCommerzForm] = useState(emptySSLCommerzForm)
  const [editDBBLForm, setEditDBBLForm] = useState(emptyDBBLForm)
  const [editMidtransForm, setEditMidtransForm] = useState(emptyMidtransForm)
  const [editInstaMojoForm, setEditInstaMojoForm] = useState(emptyInstaMojoForm)
  const [editFlutterWaveForm, setEditFlutterWaveForm] = useState(emptyFlutterWaveForm)
  const [editIpayForm, setEditIpayForm] = useState(emptyIpayForm)

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(paymentSettingData.map((item) => item.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return paymentSettingData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.paypal, row.payUMoney, row.payTM]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesSchool = filters.school === 'Select' || row.school === filters.school

      return matchesSearch && matchesSchool
    })
  }, [search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [currentPage, filtered, rowsPerPage])

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedRows.includes(row.sl))

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows((prev) => [...new Set([...prev, ...paginated.map((row) => row.sl)])])
    } else {
      setSelectedRows((prev) => prev.filter((id) => !paginated.some((row) => row.sl === id)))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    )
  }

  const handleChange = (setter) => (e) => {
    const { id, value } = e.target
    setter((prev) => ({ ...prev, [id]: value }))
  }

  const handleGatewayChange = (e) => {
    setSelectedGateway(e.target.value)
  }

  const handlePendingFilterChange = (e) => {
    const { id, value } = e.target
    setPendingFilters((prev) => ({ ...prev, [id]: value }))
  }

  const handleApplyFilters = (e) => {
    e.preventDefault()
    setFilters(pendingFilters)
    setCurrentPage(1)
    setIsFilterSidebarOpen(false)
  }

  const handleResetFilters = () => {
    setPendingFilters(emptyFilters)
    setFilters(emptyFilters)
    setCurrentPage(1)
  }

  const openAdd = () => {
    setSelectedGateway('PayPal')
    setAddPaypalForm(emptyPaypalForm)
    setAddStripeForm(emptyStripeForm)
    setAddPayUMoneyForm(emptyPayUMoneyForm)
    setAddCCAvenueForm(emptyCCAvenueForm)
    setAddPayTMForm(emptyPayTMForm)
    setAddPayStackForm(emptyPayStackForm)
    setAddJazzCashForm(emptyJazzCashForm)
    setAddSSLCommerzForm(emptySSLCommerzForm)
    setAddDBBLForm(emptyDBBLForm)
    setAddMidtransForm(emptyMidtransForm)
    setAddInstaMojoForm(emptyInstaMojoForm)
    setAddFlutterWaveForm(emptyFlutterWaveForm)
    setAddIpayForm(emptyIpayForm)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setSelectedGateway('PayPal')
    setEditPaypalForm({ ...emptyPaypalForm, school: row.school, paypalEmail: row.paypal })
    setEditStripeForm({ ...emptyStripeForm, school: row.school })
    setEditPayUMoneyForm({ ...emptyPayUMoneyForm, school: row.school, payumoneyKey: row.payUMoney })
    setEditCCAvenueForm({ ...emptyCCAvenueForm, school: row.school, merchantId: row.ccaVenue })
    setEditPayTMForm({ ...emptyPayTMForm, school: row.school, merchantMid: row.payTM })
    setEditPayStackForm({ ...emptyPayStackForm, school: row.school, secretKey: row.payStack })
    setEditStep(0)
    setIsEditOpen(true)
  }

  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages, start + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    return pages
  }

  const getCurrentAddForm = () => {
    switch (selectedGateway) {
      case 'PayPal': return { form: addPaypalForm, setter: setAddPaypalForm }
      case 'Stripe': return { form: addStripeForm, setter: setAddStripeForm }
      case 'PayUMoney': return { form: addPayUMoneyForm, setter: setAddPayUMoneyForm }
      case 'CCAvenue': return { form: addCCAvenueForm, setter: setAddCCAvenueForm }
      case 'PayTM': return { form: addPayTMForm, setter: setAddPayTMForm }
      case 'PayStack': return { form: addPayStackForm, setter: setAddPayStackForm }
      case 'JazzCash': return { form: addJazzCashForm, setter: setAddJazzCashForm }
      case 'SSLCommerz': return { form: addSSLCommerzForm, setter: setAddSSLCommerzForm }
      case 'DBBL': return { form: addDBBLForm, setter: setAddDBBLForm }
      case 'Midtrans': return { form: addMidtransForm, setter: setAddMidtransForm }
      case 'InstaMojo': return { form: addInstaMojoForm, setter: setAddInstaMojoForm }
      case 'FlutterWave': return { form: addFlutterWaveForm, setter: setAddFlutterWaveForm }
      case 'iPay': return { form: addIpayForm, setter: setAddIpayForm }
      default: return { form: addPaypalForm, setter: setAddPaypalForm }
    }
  }

  const getCurrentEditForm = () => {
    switch (selectedGateway) {
      case 'PayPal': return { form: editPaypalForm, setter: setEditPaypalForm }
      case 'Stripe': return { form: editStripeForm, setter: setEditStripeForm }
      case 'PayUMoney': return { form: editPayUMoneyForm, setter: setEditPayUMoneyForm }
      case 'CCAvenue': return { form: editCCAvenueForm, setter: setEditCCAvenueForm }
      case 'PayTM': return { form: editPayTMForm, setter: setEditPayTMForm }
      case 'PayStack': return { form: editPayStackForm, setter: setEditPayStackForm }
      case 'JazzCash': return { form: editJazzCashForm, setter: setEditJazzCashForm }
      case 'SSLCommerz': return { form: editSSLCommerzForm, setter: setEditSSLCommerzForm }
      case 'DBBL': return { form: editDBBLForm, setter: setEditDBBLForm }
      case 'Midtrans': return { form: editMidtransForm, setter: setEditMidtransForm }
      case 'InstaMojo': return { form: editInstaMojoForm, setter: setEditInstaMojoForm }
      case 'FlutterWave': return { form: editFlutterWaveForm, setter: setEditFlutterWaveForm }
      case 'iPay': return { form: editIpayForm, setter: setEditIpayForm }
      default: return { form: editPaypalForm, setter: setEditPaypalForm }
    }
  }

  const renderGatewayForm = (form, setter) => {
    const gateway = selectedGateway

    if (gateway === 'PayPal') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Paypal Email" required full>
            <input type="email" className="avm-input" id="paypalEmail" placeholder="Paypal Email" value={form.paypalEmail} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'Stripe') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Secret Key" required full>
            <input type="text" className="avm-input" id="secretKey" placeholder="Secret Key" value={form.secretKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Publishable Key" required full>
            <input type="text" className="avm-input" id="publishableKey" placeholder="Publishable Key" value={form.publishableKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'PayUMoney') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Payumoney Key" required full>
            <input type="text" className="avm-input" id="payumoneyKey" placeholder="Payumoney Key" value={form.payumoneyKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Key Salt" required full>
            <input type="text" className="avm-input" id="keySalt" placeholder="Key Salt" value={form.keySalt} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'CCAvenue') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Merchant ID" required full>
            <input type="text" className="avm-input" id="merchantId" placeholder="Merchant ID" value={form.merchantId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Working Key" required full>
            <input type="text" className="avm-input" id="workingKey" placeholder="Working Key" value={form.workingKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Access Code" required full>
            <input type="text" className="avm-input" id="accessCode" placeholder="Access Code" value={form.accessCode} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'PayTM') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Merchant Key" required full>
            <input type="text" className="avm-input" id="merchantKey" placeholder="Merchant Key" value={form.merchantKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Merchant MID" required full>
            <input type="text" className="avm-input" id="merchantMid" placeholder="Merchant MID" value={form.merchantMid} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Website" required full>
            <input type="text" className="avm-input" id="website" placeholder="Website" value={form.website} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Industry Type" required full>
            <input type="text" className="avm-input" id="industryType" placeholder="Industry Type" value={form.industryType} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'PayStack') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Secret Key" required full>
            <input type="text" className="avm-input" id="secretKey" placeholder="Secret Key" value={form.secretKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Public Key" required full>
            <input type="text" className="avm-input" id="publicKey" placeholder="Public Key" value={form.publicKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'JazzCash') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Merchant ID" required full>
            <input type="text" className="avm-input" id="merchantId" placeholder="Merchant ID" value={form.merchantId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Key Salt" required full>
            <input type="text" className="avm-input" id="keySalt" placeholder="Key Salt" value={form.keySalt} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'SSLCommerz') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Store ID" required full>
            <input type="text" className="avm-input" id="storeId" placeholder="Store ID" value={form.storeId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'DBBL') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="User ID" required full>
            <input type="text" className="avm-input" id="userId" placeholder="User ID" value={form.userId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Submer Name" required full>
            <input type="text" className="avm-input" id="submerName" placeholder="Submer Name" value={form.submerName} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Submer ID" required full>
            <input type="text" className="avm-input" id="submerId" placeholder="Submer ID" value={form.submerId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Terminal ID" required full>
            <input type="text" className="avm-input" id="terminalId" placeholder="Terminal ID" value={form.terminalId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'Midtrans') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Client Key" required full>
            <input type="text" className="avm-input" id="clientKey" placeholder="Client Key" value={form.clientKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Server Key" required full>
            <input type="text" className="avm-input" id="serverKey" placeholder="Server Key" value={form.serverKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'InstaMojo') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Api Key" required full>
            <input type="text" className="avm-input" id="apiKey" placeholder="Api Key" value={form.apiKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Auth Token" required full>
            <input type="text" className="avm-input" id="authToken" placeholder="Auth Token" value={form.authToken} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Key Salt" required full>
            <input type="text" className="avm-input" id="keySalt" placeholder="Key Salt" value={form.keySalt} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'FlutterWave') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Public Key" required full>
            <input type="text" className="avm-input" id="publicKey" placeholder="Public Key" value={form.publicKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Secret Key" required full>
            <input type="text" className="avm-input" id="secretKey" placeholder="Secret Key" value={form.secretKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    if (gateway === 'iPay') {
      return (
        <>
          <FormField label="School Name" required full>
            <select className="avm-select" id="school" value={form.school} onChange={handleChange(setter)}>
              <option value="">--Select School--</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Vendor ID" required full>
            <input type="text" className="avm-input" id="vendorId" placeholder="Vendor ID" value={form.vendorId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Hash Key" required full>
            <input type="text" className="avm-input" id="hashKey" placeholder="Hash Key" value={form.hashKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Demo?" required>
            <select className="avm-select" id="isDemo" value={form.isDemo} onChange={handleChange(setter)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>

          <FormField label="Extra Charge (%)">
            <input type="number" className="avm-input" id="extraCharge" placeholder="Extra Charge (%)" value={form.extraCharge} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Is Active?" required>
            <select className="avm-select" id="isActive" value={form.isActive} onChange={handleChange(setter)}>
              {isActiveOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'Select' ? '--Select--' : option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      )
    }

    return null
  }

  const renderAddForm = () => {
    const { form, setter } = getCurrentAddForm()
    return (
      <>
        <p className="avm-section-title">{STEPS[0]}</p>
        <div className="avm-grid">
          <FormField label="Gateway" required full>
            <select className="avm-select" value={selectedGateway} onChange={handleGatewayChange}>
              {gatewayOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>
          {renderGatewayForm(form, setter)}
        </div>
      </>
    )
  }

  const renderEditForm = () => {
    const { form, setter } = getCurrentEditForm()
    return (
      <>
        <p className="avm-section-title">{STEPS[0]}</p>
        <div className="avm-grid">
          <FormField label="Gateway" required full>
            <select className="avm-select" value={selectedGateway} onChange={handleGatewayChange}>
              {gatewayOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>
          {renderGatewayForm(form, setter)}
        </div>
      </>
    )
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Payment Setting</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Payment Setting</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={openAdd}
        >
          <span className="d-flex text-md">
            <i className="ri-add-large-line"></i>
          </span>
          Add Payment Setting
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown onExportExcel={() => {}} onExportPDF={() => {}} />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                onClick={() => setIsFilterSidebarOpen(true)}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Filter
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    Columns
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  {columnOptions.map((column) => (
                    <li key={column.key}>
                      <label className="dropdown-item px-12 py-8 rounded text-secondary-light d-flex align-items-center gap-8 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={visibleColumns[column.key]}
                          onChange={() => toggleColumn(column.key)}
                        />
                        {column.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <select
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search payment settings..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="p-0 table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th scope="col">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={allSelected}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.school ? <th scope="col">School</th> : null}
                  {visibleColumns.paypal ? <th scope="col">PayPal</th> : null}
                  {visibleColumns.payUMoney ? <th scope="col">PayUMoney</th> : null}
                  {visibleColumns.ccaVenue ? <th scope="col">CCAvenue</th> : null}
                  {visibleColumns.payTM ? <th scope="col">PayTM</th> : null}
                  {visibleColumns.payStack ? <th scope="col">PayStack</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount + 1}
                      className="text-center py-40 text-secondary-light"
                    >
                      No payment settings found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.sl}>
                      <td>
                        <div className="form-check style-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedRows.includes(row.sl)}
                            onChange={() => handleSelectRow(row.sl)}
                          />
                          <label className="form-check-label">{row.sl}</label>
                        </div>
                      </td>
                      {visibleColumns.school ? (
                        <td className="fw-medium text-primary-light">{row.school}</td>
                      ) : null}
                      {visibleColumns.paypal ? <td>{row.paypal}</td> : null}
                      {visibleColumns.payUMoney ? <td>{row.payUMoney}</td> : null}
                      {visibleColumns.ccaVenue ? <td>{row.ccaVenue}</td> : null}
                      {visibleColumns.payTM ? <td>{row.payTM}</td> : null}
                      {visibleColumns.payStack ? <td>{row.payStack}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            type="button"
                            className="bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle"
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-16 border-top border-neutral-200">
            <span className="text-sm text-secondary-light">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
            </span>

            <div className="d-flex align-items-center gap-8">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  type="button"
                  className={
                    p === currentPage
                      ? 'btn btn-sm btn-primary-600'
                      : 'btn btn-sm btn-light border'
                  }
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light border"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Setting Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Add Payment Setting"
        steps={STEPS}
        step={addStep}
        onClose={() => setIsAddOpen(false)}
        onBack={() => setAddStep((s) => Math.max(0, s - 1))}
        onNext={() => setAddStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsAddOpen(false)}
        submitLabel="Save"
      >
        {renderAddForm()}
      </WizardPopup>

      {/* Edit Payment Setting Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit Payment Setting"
        steps={STEPS}
        step={editStep}
        onClose={() => setIsEditOpen(false)}
        onBack={() => setEditStep((s) => Math.max(0, s - 1))}
        onNext={() => setEditStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => setIsEditOpen(false)}
        submitLabel="Update"
      >
        {renderEditForm()}
      </WizardPopup>

      {/* Filter Sidebar */}
      <SlideSidebar
        isOpen={isFilterSidebarOpen}
        title="Filter Payment Setting"
        onClose={() => setIsFilterSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="school"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              School
            </label>
            <select
              id="school"
              className="form-control form-select"
              value={pendingFilters.school}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select School</option>
              {schoolOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              htmlFor="gateway"
              className="text-sm fw-semibold text-primary-light d-inline-block mb-8"
            >
              Gateway
            </label>
            <select
              id="gateway"
              className="form-control form-select"
              value={pendingFilters.gateway}
              onChange={handlePendingFilterChange}
            >
              <option value="Select">Select Gateway</option>
              {gatewayOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
              Reset
            </button>
          </div>

          <div>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default PaymentSetting
