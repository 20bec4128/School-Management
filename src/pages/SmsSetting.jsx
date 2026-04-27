import { useMemo, useState } from 'react'
import WizardPopup from '../components/WizardPopup'
import SlideSidebar from '../components/SlideSidebar'
import useColumnVisibility from '../hooks/useColumnVisibility'
import '../assets/css/addModalShared.css'

const smsSettingData = [
  {
    sl: '01',
    school: 'Windsor Park High School',
    twilio: 'twilio_windsor',
    bulk: 'bulk_windsor',
    msg91: 'msg91_windsor',
    textLocal: 'textlocal_windsor',
    smsCountry: 'smscountry_windsor',
    betaSms: 'betasms_windsor',
    bulkPk: 'bulkpk_windsor',
    alphaNet: 'alphanet_windsor',
    bdBulk: 'bdbulk_windsor',
    mimSms: 'mimsms_windsor',
  },
  {
    sl: '02',
    school: 'Riverside Academy',
    twilio: 'twilio_riverside',
    bulk: 'bulk_riverside',
    msg91: 'msg91_riverside',
    textLocal: 'textlocal_riverside',
    smsCountry: 'smscountry_riverside',
    betaSms: 'betasms_riverside',
    bulkPk: 'bulkpk_riverside',
    alphaNet: 'alphanet_riverside',
    bdBulk: 'bdbulk_riverside',
    mimSms: 'mimsms_riverside',
  },
  {
    sl: '03',
    school: 'Sunrise Public School',
    twilio: 'twilio_sunrise',
    bulk: 'bulk_sunrise',
    msg91: 'msg91_sunrise',
    textLocal: 'textlocal_sunrise',
    smsCountry: 'smscountry_sunrise',
    betaSms: 'betasms_sunrise',
    bulkPk: 'bulkpk_sunrise',
    alphaNet: 'alphanet_sunrise',
    bdBulk: 'bdbulk_sunrise',
    mimSms: 'mimsms_sunrise',
  },
  {
    sl: '04',
    school: 'Green Valley School',
    twilio: 'twilio_greenvalley',
    bulk: 'bulk_greenvalley',
    msg91: 'msg91_greenvalley',
    textLocal: 'textlocal_greenvalley',
    smsCountry: 'smscountry_greenvalley',
    betaSms: 'betasms_greenvalley',
    bulkPk: 'bulkpk_greenvalley',
    alphaNet: 'alphanet_greenvalley',
    bdBulk: 'bdbulk_greenvalley',
    mimSms: 'mimsms_greenvalley',
  },
  {
    sl: '05',
    school: 'Hilltop Academy',
    twilio: 'twilio_hilltop',
    bulk: 'bulk_hilltop',
    msg91: 'msg91_hilltop',
    textLocal: 'textlocal_hilltop',
    smsCountry: 'smscountry_hilltop',
    betaSms: 'betasms_hilltop',
    bulkPk: 'bulkpk_hilltop',
    alphaNet: 'alphanet_hilltop',
    bdBulk: 'bdbulk_hilltop',
    mimSms: 'mimsms_hilltop',
  },
]

// Twilio Form
const emptyTwilioForm = {
  gateway: 'Twilio',
  school: '',
  accountSid: '',
  authToken: '',
  fromNumber: '',
  isActive: 'Select',
}

// Clicktell Form
const emptyClicktellForm = {
  gateway: 'Clicktell',
  school: '',
  username: '',
  password: '',
  apiKey: '',
  fromNumber: '',
  moNumber: '',
  isActive: 'Select',
}

// Bulk Form
const emptyBulkForm = {
  gateway: 'Bulk',
  school: '',
  username: '',
  password: '',
  isActive: 'Select',
}

// MSG91 Form
const emptyMsg91Form = {
  gateway: 'MSG91',
  school: '',
  username: '',
  password: '',
  isActive: 'Select',
}

// Plivo Form
const emptyPlivoForm = {
  gateway: 'Plivo',
  school: '',
  authId: '',
  authToken: '',
  fromNumber: '',
  isActive: 'Select',
}

// Text Local Form
const emptyTextLocalForm = {
  gateway: 'TextLocal',
  school: '',
  username: '',
  hashKey: '',
  senderId: '',
  isActive: 'Select',
}

// SMS Country Form
const emptySmsCountryForm = {
  gateway: 'SMSCountry',
  school: '',
  username: '',
  password: '',
  senderId: '',
  isActive: 'Select',
}

// Beta SMS Form
const emptyBetaSmsForm = {
  gateway: 'BetaSMS',
  school: '',
  username: '',
  password: '',
  senderId: '',
  isActive: 'Select',
}

// Bulk PK Form (same as Beta SMS)
const emptyBulkPkForm = {
  gateway: 'BulkPK',
  school: '',
  username: '',
  password: '',
  senderId: '',
  isActive: 'Select',
}

// SMS Cluster Form
const emptySmsClusterForm = {
  gateway: 'SMSCluster',
  school: '',
  authKey: '',
  senderId: '',
  router: '',
  isActive: 'Select',
}

// Alpha.net Form
const emptyAlphaNetForm = {
  gateway: 'AlphaNet',
  school: '',
  username: '',
  hashKey: '',
  smsType: 'Text',
  isActive: 'Select',
}

// BD Bulk Form
const emptyBdBulkForm = {
  gateway: 'BDBulk',
  school: '',
  hashKey: '',
  smsType: 'Text',
  isActive: 'No',
}

// Mim SMS Form
const emptyMimSmsForm = {
  gateway: 'MimSMS',
  school: '',
  apiKey: '',
  senderId: '',
  smsType: 'Text',
  isActive: 'Select',
}

// Bulk 360 Form
const emptyBulk360Form = {
  gateway: 'Bulk360',
  school: '',
  username: '',
  password: '',
  fromNumber: '',
  isActive: 'Select',
}

// SMS To Form
const emptySmsToForm = {
  gateway: 'SMSTo',
  school: '',
  apiKey: '',
  senderId: '',
  isActive: 'Select',
}

const emptyFilters = {
  school: 'Select',
  gateway: 'Select',
}

const STEPS = ['SMS Gateway Settings']

const gatewayOptions = [
  'Twilio', 'Clicktell', 'Bulk', 'MSG91', 'Plivo', 'TextLocal', 'SMSCountry',
  'BetaSMS', 'BulkPK', 'SMSCluster', 'AlphaNet', 'BDBulk', 'MimSMS', 'Bulk360', 'SMSTo'
]

const isActiveOptions = ['Select', 'Yes', 'No']
const smsTypeOptions = ['Text', 'Unicode', 'Flash']

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  'Gateway': 'ri-wallet-line',
  'Account SID': 'ri-id-card-line',
  'Auth Token': 'ri-key-line',
  'From Number': 'ri-phone-line',
  'Is Active?': 'ri-checkbox-circle-line',
  'Username': 'ri-user-line',
  'Password': 'ri-lock-password-line',
  'Api Key': 'ri-api-line',
  'Mo Number': 'ri-phone-line',
  'Auth ID': 'ri-id-card-line',
  'Hash Key': 'ri-key-line',
  'Sender ID': 'ri-mail-send-line',
  'Auth Key': 'ri-key-line',
  'Router': 'ri-router-line',
  'SMS Type': 'ri-message-2-line',
}

const columnOptions = [
  { key: 'school', label: 'School' },
  { key: 'twilio', label: 'Twilio' },
  { key: 'bulk', label: 'Bulk' },
  { key: 'msg91', label: 'MSG91' },
  { key: 'textLocal', label: 'Text Local' },
  { key: 'smsCountry', label: 'SMS Country' },
  { key: 'betaSms', label: 'Beta SMS' },
  { key: 'bulkPk', label: 'Bulk PK' },
  { key: 'alphaNet', label: 'Alpha.net' },
  { key: 'bdBulk', label: 'BD Bulk' },
  { key: 'mimSms', label: 'Mim SMS' },
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

const SmsSetting = () => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState('Twilio')
  const [addStep, setAddStep] = useState(0)
  const [editStep, setEditStep] = useState(0)

  // Form states for each gateway
  const [addTwilioForm, setAddTwilioForm] = useState(emptyTwilioForm)
  const [addClicktellForm, setAddClicktellForm] = useState(emptyClicktellForm)
  const [addBulkForm, setAddBulkForm] = useState(emptyBulkForm)
  const [addMsg91Form, setAddMsg91Form] = useState(emptyMsg91Form)
  const [addPlivoForm, setAddPlivoForm] = useState(emptyPlivoForm)
  const [addTextLocalForm, setAddTextLocalForm] = useState(emptyTextLocalForm)
  const [addSmsCountryForm, setAddSmsCountryForm] = useState(emptySmsCountryForm)
  const [addBetaSmsForm, setAddBetaSmsForm] = useState(emptyBetaSmsForm)
  const [addBulkPkForm, setAddBulkPkForm] = useState(emptyBulkPkForm)
  const [addSmsClusterForm, setAddSmsClusterForm] = useState(emptySmsClusterForm)
  const [addAlphaNetForm, setAddAlphaNetForm] = useState(emptyAlphaNetForm)
  const [addBdBulkForm, setAddBdBulkForm] = useState(emptyBdBulkForm)
  const [addMimSmsForm, setAddMimSmsForm] = useState(emptyMimSmsForm)
  const [addBulk360Form, setAddBulk360Form] = useState(emptyBulk360Form)
  const [addSmsToForm, setAddSmsToForm] = useState(emptySmsToForm)

  const [editTwilioForm, setEditTwilioForm] = useState(emptyTwilioForm)
  const [editClicktellForm, setEditClicktellForm] = useState(emptyClicktellForm)
  const [editBulkForm, setEditBulkForm] = useState(emptyBulkForm)
  const [editMsg91Form, setEditMsg91Form] = useState(emptyMsg91Form)
  const [editPlivoForm, setEditPlivoForm] = useState(emptyPlivoForm)
  const [editTextLocalForm, setEditTextLocalForm] = useState(emptyTextLocalForm)
  const [editSmsCountryForm, setEditSmsCountryForm] = useState(emptySmsCountryForm)
  const [editBetaSmsForm, setEditBetaSmsForm] = useState(emptyBetaSmsForm)
  const [editBulkPkForm, setEditBulkPkForm] = useState(emptyBulkPkForm)
  const [editSmsClusterForm, setEditSmsClusterForm] = useState(emptySmsClusterForm)
  const [editAlphaNetForm, setEditAlphaNetForm] = useState(emptyAlphaNetForm)
  const [editBdBulkForm, setEditBdBulkForm] = useState(emptyBdBulkForm)
  const [editMimSmsForm, setEditMimSmsForm] = useState(emptyMimSmsForm)
  const [editBulk360Form, setEditBulk360Form] = useState(emptyBulk360Form)
  const [editSmsToForm, setEditSmsToForm] = useState(emptySmsToForm)

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const schoolOptions = useMemo(
    () => Array.from(new Set(smsSettingData.map((item) => item.school))),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return smsSettingData.filter((row) => {
      const matchesSearch =
        !q ||
        [row.school, row.twilio, row.bulk, row.msg91, row.textLocal]
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
    setSelectedGateway('Twilio')
    setAddTwilioForm(emptyTwilioForm)
    setAddClicktellForm(emptyClicktellForm)
    setAddBulkForm(emptyBulkForm)
    setAddMsg91Form(emptyMsg91Form)
    setAddPlivoForm(emptyPlivoForm)
    setAddTextLocalForm(emptyTextLocalForm)
    setAddSmsCountryForm(emptySmsCountryForm)
    setAddBetaSmsForm(emptyBetaSmsForm)
    setAddBulkPkForm(emptyBulkPkForm)
    setAddSmsClusterForm(emptySmsClusterForm)
    setAddAlphaNetForm(emptyAlphaNetForm)
    setAddBdBulkForm(emptyBdBulkForm)
    setAddMimSmsForm(emptyMimSmsForm)
    setAddBulk360Form(emptyBulk360Form)
    setAddSmsToForm(emptySmsToForm)
    setAddStep(0)
    setIsAddOpen(true)
  }

  const openEdit = (row) => {
    setSelectedGateway('Twilio')
    setEditTwilioForm({ ...emptyTwilioForm, school: row.school, accountSid: row.twilio })
    setEditClicktellForm({ ...emptyClicktellForm, school: row.school })
    setEditBulkForm({ ...emptyBulkForm, school: row.school, username: row.bulk })
    setEditMsg91Form({ ...emptyMsg91Form, school: row.school, username: row.msg91 })
    setEditTextLocalForm({ ...emptyTextLocalForm, school: row.school, username: row.textLocal })
    setEditSmsCountryForm({ ...emptySmsCountryForm, school: row.school, username: row.smsCountry })
    setEditBetaSmsForm({ ...emptyBetaSmsForm, school: row.school, username: row.betaSms })
    setEditBulkPkForm({ ...emptyBulkPkForm, school: row.school, username: row.bulkPk })
    setEditAlphaNetForm({ ...emptyAlphaNetForm, school: row.school, username: row.alphaNet })
    setEditBdBulkForm({ ...emptyBdBulkForm, school: row.school, hashKey: row.bdBulk })
    setEditMimSmsForm({ ...emptyMimSmsForm, school: row.school, apiKey: row.mimSms })
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
      case 'Twilio': return { form: addTwilioForm, setter: setAddTwilioForm }
      case 'Clicktell': return { form: addClicktellForm, setter: setAddClicktellForm }
      case 'Bulk': return { form: addBulkForm, setter: setAddBulkForm }
      case 'MSG91': return { form: addMsg91Form, setter: setAddMsg91Form }
      case 'Plivo': return { form: addPlivoForm, setter: setAddPlivoForm }
      case 'TextLocal': return { form: addTextLocalForm, setter: setAddTextLocalForm }
      case 'SMSCountry': return { form: addSmsCountryForm, setter: setAddSmsCountryForm }
      case 'BetaSMS': return { form: addBetaSmsForm, setter: setAddBetaSmsForm }
      case 'BulkPK': return { form: addBulkPkForm, setter: setAddBulkPkForm }
      case 'SMSCluster': return { form: addSmsClusterForm, setter: setAddSmsClusterForm }
      case 'AlphaNet': return { form: addAlphaNetForm, setter: setAddAlphaNetForm }
      case 'BDBulk': return { form: addBdBulkForm, setter: setAddBdBulkForm }
      case 'MimSMS': return { form: addMimSmsForm, setter: setAddMimSmsForm }
      case 'Bulk360': return { form: addBulk360Form, setter: setAddBulk360Form }
      case 'SMSTo': return { form: addSmsToForm, setter: setAddSmsToForm }
      default: return { form: addTwilioForm, setter: setAddTwilioForm }
    }
  }

  const getCurrentEditForm = () => {
    switch (selectedGateway) {
      case 'Twilio': return { form: editTwilioForm, setter: setEditTwilioForm }
      case 'Clicktell': return { form: editClicktellForm, setter: setEditClicktellForm }
      case 'Bulk': return { form: editBulkForm, setter: setEditBulkForm }
      case 'MSG91': return { form: editMsg91Form, setter: setEditMsg91Form }
      case 'Plivo': return { form: editPlivoForm, setter: setEditPlivoForm }
      case 'TextLocal': return { form: editTextLocalForm, setter: setEditTextLocalForm }
      case 'SMSCountry': return { form: editSmsCountryForm, setter: setEditSmsCountryForm }
      case 'BetaSMS': return { form: editBetaSmsForm, setter: setEditBetaSmsForm }
      case 'BulkPK': return { form: editBulkPkForm, setter: setEditBulkPkForm }
      case 'SMSCluster': return { form: editSmsClusterForm, setter: setEditSmsClusterForm }
      case 'AlphaNet': return { form: editAlphaNetForm, setter: setEditAlphaNetForm }
      case 'BDBulk': return { form: editBdBulkForm, setter: setEditBdBulkForm }
      case 'MimSMS': return { form: editMimSmsForm, setter: setEditMimSmsForm }
      case 'Bulk360': return { form: editBulk360Form, setter: setEditBulk360Form }
      case 'SMSTo': return { form: editSmsToForm, setter: setEditSmsToForm }
      default: return { form: editTwilioForm, setter: setEditTwilioForm }
    }
  }

  const renderGatewayForm = (form, setter) => {
    const gateway = selectedGateway

    if (gateway === 'Twilio') {
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

          <FormField label="Account SID" required full>
            <input type="text" className="avm-input" id="accountSid" placeholder="Account SID" value={form.accountSid} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Auth Token" required full>
            <input type="text" className="avm-input" id="authToken" placeholder="Auth Token" value={form.authToken} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="From Number" required full>
            <input type="text" className="avm-input" id="fromNumber" placeholder="From Number" value={form.fromNumber} onChange={handleChange(setter)} />
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

    if (gateway === 'Clicktell') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Api Key" required full>
            <input type="text" className="avm-input" id="apiKey" placeholder="Api Key" value={form.apiKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="From Number" required full>
            <input type="text" className="avm-input" id="fromNumber" placeholder="From Number" value={form.fromNumber} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Mo Number" required full>
            <input type="text" className="avm-input" id="moNumber" placeholder="Mo Number" value={form.moNumber} onChange={handleChange(setter)} />
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

    if (gateway === 'Bulk') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
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

    if (gateway === 'MSG91') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
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

    if (gateway === 'Plivo') {
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

          <FormField label="Auth ID" required full>
            <input type="text" className="avm-input" id="authId" placeholder="Auth ID" value={form.authId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Auth Token" required full>
            <input type="text" className="avm-input" id="authToken" placeholder="Auth Token" value={form.authToken} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="From Number" required full>
            <input type="text" className="avm-input" id="fromNumber" placeholder="From Number" value={form.fromNumber} onChange={handleChange(setter)} />
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

    if (gateway === 'TextLocal') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Hash Key" required full>
            <input type="text" className="avm-input" id="hashKey" placeholder="Hash Key" value={form.hashKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Sender ID" required full>
            <input type="text" className="avm-input" id="senderId" placeholder="Sender ID" value={form.senderId} onChange={handleChange(setter)} />
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

    if (gateway === 'SMSCountry') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Sender ID" required full>
            <input type="text" className="avm-input" id="senderId" placeholder="Sender ID" value={form.senderId} onChange={handleChange(setter)} />
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

    if (gateway === 'BetaSMS') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Sender ID" required full>
            <input type="text" className="avm-input" id="senderId" placeholder="Sender ID" value={form.senderId} onChange={handleChange(setter)} />
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

    if (gateway === 'BulkPK') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Sender ID" required full>
            <input type="text" className="avm-input" id="senderId" placeholder="Sender ID" value={form.senderId} onChange={handleChange(setter)} />
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

    if (gateway === 'SMSCluster') {
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

          <FormField label="Auth Key" required full>
            <input type="text" className="avm-input" id="authKey" placeholder="Auth Key" value={form.authKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Sender ID" required full>
            <input type="text" className="avm-input" id="senderId" placeholder="Sender ID" value={form.senderId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Router" required full>
            <input type="text" className="avm-input" id="router" placeholder="Router" value={form.router} onChange={handleChange(setter)} />
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

    if (gateway === 'AlphaNet') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Hash Key" required full>
            <input type="text" className="avm-input" id="hashKey" placeholder="Hash Key" value={form.hashKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="SMS Type" required>
            <select className="avm-select" id="smsType" value={form.smsType} onChange={handleChange(setter)}>
              {smsTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
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

    if (gateway === 'BDBulk') {
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

          <FormField label="Hash Key" required full>
            <input type="text" className="avm-input" id="hashKey" placeholder="Hash Key" value={form.hashKey} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="SMS Type" required>
            <select className="avm-select" id="smsType" value={form.smsType} onChange={handleChange(setter)}>
              {smsTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
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

    if (gateway === 'MimSMS') {
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

          <FormField label="Sender ID" required full>
            <input type="text" className="avm-input" id="senderId" placeholder="Sender ID" value={form.senderId} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="SMS Type" required>
            <select className="avm-select" id="smsType" value={form.smsType} onChange={handleChange(setter)}>
              {smsTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
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

    if (gateway === 'Bulk360') {
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

          <FormField label="Username" required full>
            <input type="text" className="avm-input" id="username" placeholder="Username" value={form.username} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="Password" required full>
            <input type="password" className="avm-input" id="password" placeholder="Password" value={form.password} onChange={handleChange(setter)} />
          </FormField>

          <FormField label="From Number" required full>
            <input type="text" className="avm-input" id="fromNumber" placeholder="From Number" value={form.fromNumber} onChange={handleChange(setter)} />
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

    if (gateway === 'SMSTo') {
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

          <FormField label="Sender ID" required full>
            <input type="text" className="avm-input" id="senderId" placeholder="Sender ID" value={form.senderId} onChange={handleChange(setter)} />
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
          <h1 className="fw-semibold mb-4 h6 text-primary-light">SMS Setting</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / SMS Setting</span>
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
          Add SMS Setting
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                    <i className="ri-file-upload-line text-md line-height-1"></i> Export
                  </span>
                  <span>
                    <i className="ri-arrow-down-s-line"></i>
                  </span>
                </button>
                <ul className="dropdown-menu p-12 border bg-base shadow">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-3-line"></i> PDF
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                    >
                      <i className="ri-file-excel-2-line"></i> Excel
                    </button>
                  </li>
                </ul>
              </div>

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
                placeholder="Search SMS settings..."
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
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1400 }}>
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
                  {visibleColumns.twilio ? <th scope="col">Twilio</th> : null}
                  {visibleColumns.bulk ? <th scope="col">Bulk</th> : null}
                  {visibleColumns.msg91 ? <th scope="col">MSG91</th> : null}
                  {visibleColumns.textLocal ? <th scope="col">Text Local</th> : null}
                  {visibleColumns.smsCountry ? <th scope="col">SMS Country</th> : null}
                  {visibleColumns.betaSms ? <th scope="col">Beta SMS</th> : null}
                  {visibleColumns.bulkPk ? <th scope="col">Bulk PK</th> : null}
                  {visibleColumns.alphaNet ? <th scope="col">Alpha.net</th> : null}
                  {visibleColumns.bdBulk ? <th scope="col">BD Bulk</th> : null}
                  {visibleColumns.mimSms ? <th scope="col">Mim SMS</th> : null}
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
                      No SMS settings found.
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
                      {visibleColumns.twilio ? <td>{row.twilio}</td> : null}
                      {visibleColumns.bulk ? <td>{row.bulk}</td> : null}
                      {visibleColumns.msg91 ? <td>{row.msg91}</td> : null}
                      {visibleColumns.textLocal ? <td>{row.textLocal}</td> : null}
                      {visibleColumns.smsCountry ? <td>{row.smsCountry}</td> : null}
                      {visibleColumns.betaSms ? <td>{row.betaSms}</td> : null}
                      {visibleColumns.bulkPk ? <td>{row.bulkPk}</td> : null}
                      {visibleColumns.alphaNet ? <td>{row.alphaNet}</td> : null}
                      {visibleColumns.bdBulk ? <td>{row.bdBulk}</td> : null}
                      {visibleColumns.mimSms ? <td>{row.mimSms}</td> : null}
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

      {/* Add SMS Setting Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isAddOpen}
        title="Add SMS Setting"
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

      {/* Edit SMS Setting Modal */}
      <WizardPopup
        modalWidth="620px"
        open={isEditOpen}
        title="Edit SMS Setting"
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
        title="Filter SMS Setting"
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

export default SmsSetting