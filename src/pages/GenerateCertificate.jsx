import { useCallback, useEffect, useMemo, useState } from 'react'
import SlideSidebar from '../components/SlideSidebar'
import RowsPerPageSelect from '../components/RowsPerPageSelect'
import TablePagination from '../components/table/TablePagination'
import ManualScopeSelectors from '../components/ManualScopeSelectors'
import ExportDropdown from '../components/ExportDropdown'
import useColumnVisibility from '../hooks/useColumnVisibility'
import { useAuth } from '../context/useAuth'
import { useSchool } from '../context/useSchool'
import { normalizeRole } from '../utils/roles'
import { fetchHeadOfficesPage } from '../apis/headOfficesApi'
import { fetchSchoolsLookup } from '../apis/schoolsApi'
import { fetchClasses } from '../apis/classesApi'
import { fetchSections } from '../apis/sectionsApi'
import { fetchStudentsPage } from '../apis/studentsApi'
import { fetchCertificateTypesLookup } from '../apis/certificateTypesApi'
import '../assets/css/addModalShared.css'

const EMPTY_FILTERS = {
  headOfficeId: '',
  schoolId: '',
  classId: 'Select',
  sectionId: 'Select',
  certificateTypeId: '',
}

const columnOptions = [
  { key: 'schoolName', label: 'School', defaultVisible: false },
  { key: 'certificateType', label: 'Certificate Type' },
  { key: 'photo', label: 'Photo' },
  { key: 'name', label: 'Name' },
  { key: 'admissionNo', label: 'Admission No' },
  { key: 'className', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'rollNo', label: 'Roll No' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
]

const normalizeText = (value) => String(value ?? '').trim()

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const fetchAllStudentPages = async (query) => {
  const firstPage = await fetchStudentsPage(0, 500, query)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  if (totalPages <= 1) return firstContent

  const requests = []
  for (let page = 1; page < totalPages; page += 1) {
    requests.push(fetchStudentsPage(page, 500, query))
  }

  const restPages = await Promise.all(requests)
  return restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstContent])
}

const buildCertificatePreviewHtml = ({ student, template, schoolName, headOfficeName }) => {
  const studentName = escapeHtml(student?.name || 'Student Name')
  const schoolLabel = escapeHtml(template?.schoolNameOnCard || schoolName || 'School Name')
  const title = escapeHtml(template?.certificateName || 'Certificate')
  const body = escapeHtml(
    template?.certificateText ||
      `This is to certify that ${student?.name || 'the student'} has completed the selected certificate requirements.`,
  ).replace(/\n/g, '<br />')
  const footerLeft = escapeHtml(template?.footerLeftText || 'Principal')
  const footerMiddle = escapeHtml(template?.footerMiddleText || new Date().toISOString().slice(0, 10))
  const footerRight = escapeHtml(template?.footerRightText || 'Chairman')
  const photo = student?.photoUrl ? `url('${String(student.photoUrl).replace(/'/g, '%27')}')` : 'none'
  const background = template?.backgroundUrl ? `url('${String(template.backgroundUrl).replace(/'/g, '%27')}')` : 'none'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
    }
    html, body {
      margin: 0;
      min-height: 100%;
      background: #eef2f7;
      font-family: Georgia, "Times New Roman", serif;
      color: #1f2937;
    }
    .shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      width: min(1120px, 100%);
      aspect-ratio: 1.414;
      position: relative;
      overflow: hidden;
      border: 8px double #b8891d;
      border-radius: 22px;
      background:
        ${background !== 'none' ? `${background}, ` : ''}
        linear-gradient(135deg, #fffef8 0%, #f8f3e7 100%);
      background-size: cover;
      background-position: center;
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 42px 54px 34px;
      box-sizing: border-box;
    }
    .topline, .footer, .meta {
      font-family: Arial, sans-serif;
    }
    .topline {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      font-size: 12px;
      color: #52606d;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .title {
      text-align: center;
      margin-top: 8px;
      font-size: 44px;
      line-height: 1.05;
      font-weight: 700;
      color: #9a6b00;
      letter-spacing: 0.03em;
    }
    .subtitle {
      text-align: center;
      margin-top: 6px;
      font-size: 14px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .holder {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 28px;
      align-items: center;
      margin-top: 34px;
    }
    .photo {
      width: 132px;
      height: 160px;
      border-radius: 18px;
      border: 5px solid rgba(184, 137, 29, 0.22);
      background: ${photo !== 'none' ? `${photo} center/cover no-repeat` : 'linear-gradient(180deg, #e5e7eb, #f8fafc)'};
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.65);
    }
    .student-box {
      text-align: center;
      padding: 18px 10px 14px;
    }
    .presented {
      font-family: Arial, sans-serif;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #6b7280;
    }
    .student-name {
      margin-top: 10px;
      font-size: 38px;
      font-weight: 700;
      color: #111827;
      border-bottom: 1px solid rgba(148, 163, 184, 0.8);
      display: inline-block;
      padding: 0 22px 4px;
    }
    .student-meta {
      margin-top: 16px;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px 18px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #475569;
    }
    .student-meta span {
      background: rgba(255, 255, 255, 0.68);
      border: 1px solid rgba(203, 213, 225, 0.82);
      border-radius: 999px;
      padding: 6px 12px;
    }
    .body {
      max-width: 860px;
      margin: 24px auto 0;
      text-align: center;
      font-size: 17px;
      line-height: 1.8;
      color: #334155;
      padding: 0 8px;
    }
    .footer {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 32px;
      align-items: end;
      text-align: center;
      font-size: 13px;
      color: #4b5563;
    }
    .sig {
      padding-top: 8px;
      border-top: 1px solid rgba(148, 163, 184, 0.85);
      min-height: 28px;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      font-size: 12px;
      color: #6b7280;
      margin-top: 18px;
    }
    .print-btn {
      position: fixed;
      top: 18px;
      right: 18px;
      border: 0;
      background: #1d4ed8;
      color: white;
      border-radius: 999px;
      padding: 10px 16px;
      font: inherit;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(29, 78, 216, 0.28);
    }
    @media print {
      body { background: white; }
      .shell { padding: 0; }
      .card { width: 100%; height: 100vh; border-radius: 0; box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print Certificate</button>
  <div class="shell">
    <div class="card">
      <div class="topline">
        <div>${schoolLabel}</div>
        <div>${escapeHtml(headOfficeName || '')}</div>
      </div>

      <div>
        <div class="title">${title}</div>
        <div class="subtitle">${escapeHtml(student?.certificateType || template?.certificateName || 'Certificate')}</div>

        <div class="holder">
          <div class="photo" aria-hidden="true"></div>
          <div class="student-box">
            <div class="presented">Presented To</div>
            <div class="student-name">${studentName}</div>
            <div class="student-meta">
              <span>Admission No: ${escapeHtml(student?.admissionNo || '-')}</span>
              <span>Roll No: ${escapeHtml(student?.rollNo || '-')}</span>
              <span>Class: ${escapeHtml(student?.className || '-')}</span>
              <span>Section: ${escapeHtml(student?.section || '-')}</span>
            </div>
          </div>
          <div class="photo" aria-hidden="true"></div>
        </div>

        <div class="body">${body}</div>
      </div>

      <div>
        <div class="footer">
          <div class="sig">${footerLeft}</div>
          <div class="sig">${footerMiddle}</div>
          <div class="sig">${footerRight}</div>
        </div>
        <div class="meta">
          <div>Head Office: ${escapeHtml(headOfficeName || '-')}</div>
          <div>School: ${schoolLabel}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

const openCertificatePreview = ({ student, template, schoolName, headOfficeName }) => {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1280,height=900')
  if (!win) {
    window.alert('Popup was blocked. Please allow popups to preview the certificate.')
    return
  }
  win.document.open()
  win.document.write(buildCertificatePreviewHtml({ student, template, schoolName, headOfficeName }))
  win.document.close()
  win.focus()
}

const GenerateCertificate = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth()
  const { activeSchoolId } = useSchool()

  const normalizedRole = normalizeRole(role)
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN'
  const isHeadOfficeAdmin = normalizedRole === 'HEAD_OFFICE_ADMIN'
  const isSchoolAdmin = normalizedRole === 'SCHOOL_ADMIN'

  const [schools, setSchools] = useState([])
  const [headOffices, setHeadOffices] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [certificateTypes, setCertificateTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isFindSidebarOpen, setIsFindSidebarOpen] = useState(false)
  const [pendingFilters, setPendingFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [hasSearched, setHasSearched] = useState(false)

  const { visibleColumns, visibleColumnCount, toggleColumn } = useColumnVisibility(columnOptions)

  const selectedSchoolId = useMemo(() => {
    if (isSuperAdmin) return filters.schoolId || pendingFilters.schoolId || ''
    if (isHeadOfficeAdmin) return filters.schoolId || pendingFilters.schoolId || ''
    if (activeSchoolId) return String(activeSchoolId)
    if (authSchoolId != null) return String(authSchoolId)
    return filters.schoolId || ''
  }, [activeSchoolId, authSchoolId, filters.schoolId, isHeadOfficeAdmin, isSuperAdmin, pendingFilters.schoolId])

  const selectedHeadOfficeId = useMemo(() => {
    if (isSuperAdmin) return filters.headOfficeId || pendingFilters.headOfficeId || ''
    if (isHeadOfficeAdmin) return authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    if (selectedSchoolId) {
      const school = schools.find((row) => String(row?.id ?? '') === String(selectedSchoolId))
      if (school?.headOfficeId != null) return String(school.headOfficeId)
    }
    return filters.headOfficeId || ''
  }, [authHeadOfficeId, filters.headOfficeId, isHeadOfficeAdmin, isSuperAdmin, pendingFilters.headOfficeId, schools, selectedSchoolId])

  const selectedSchool = useMemo(
    () => schools.find((row) => String(row?.id ?? '') === String(selectedSchoolId)) || null,
    [schools, selectedSchoolId],
  )

  const selectedCertificateType = useMemo(
    () => certificateTypes.find((row) => String(row?.id ?? '') === String(filters.certificateTypeId)) || null,
    [certificateTypes, filters.certificateTypeId],
  )

  const scopeSchoolOptions = useMemo(() => {
    const allRows = Array.isArray(schools) ? schools : []
    if (isSuperAdmin && pendingFilters.headOfficeId) {
      return allRows
        .filter((school) => String(school?.headOfficeId ?? '') === String(pendingFilters.headOfficeId))
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }
    if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      return allRows
        .filter((school) => String(school?.headOfficeId ?? '') === String(authHeadOfficeId))
        .sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
    }
    if (isSchoolAdmin && authSchoolId != null) {
      return allRows.filter((school) => String(school?.id ?? '') === String(authSchoolId))
    }
    return [...allRows].sort((a, b) => String(a?.schoolName || '').localeCompare(String(b?.schoolName || '')))
  }, [authHeadOfficeId, authSchoolId, isHeadOfficeAdmin, isSchoolAdmin, isSuperAdmin, pendingFilters.headOfficeId, schools])

  const classOptions = useMemo(
    () =>
      (Array.isArray(classes) ? classes : [])
        .map((row) => ({
          id: String(row?.id ?? ''),
          label: row?.className || row?.name || row?.numericName || `Class ${row?.id ?? ''}`,
        }))
        .filter((row) => row.id),
    [classes],
  )

  const sectionOptions = useMemo(
    () =>
      (Array.isArray(sections) ? sections : [])
        .map((row) => ({
          id: String(row?.id ?? ''),
          label: row?.sectionName || row?.name || `Section ${row?.id ?? ''}`,
        }))
        .filter((row) => row.id),
    [sections],
  )

  const certificateTypeOptions = useMemo(
    () =>
      (Array.isArray(certificateTypes) ? certificateTypes : [])
        .map((row) => ({
          id: String(row?.id ?? ''),
          label: row?.certificateName || `Certificate ${row?.id ?? ''}`,
        }))
        .filter((row) => row.id)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [certificateTypes],
  )

  const currentScopeForLookups = useMemo(() => {
    const schoolId = normalizeText(pendingFilters.schoolId || filters.schoolId || selectedSchoolId)
    const headOfficeId = normalizeText(pendingFilters.headOfficeId || filters.headOfficeId || selectedHeadOfficeId)
    return { schoolId, headOfficeId }
  }, [filters.headOfficeId, filters.schoolId, pendingFilters.headOfficeId, pendingFilters.schoolId, selectedHeadOfficeId, selectedSchoolId])

  const loadLookups = useCallback(async () => {
    try {
      const [headOfficePage, schoolList] = await Promise.all([
        isSuperAdmin ? fetchHeadOfficesPage(0, 500) : Promise.resolve({ content: [] }),
        fetchSchoolsLookup(),
      ])

      setHeadOffices(
        isSuperAdmin && Array.isArray(headOfficePage?.content)
          ? headOfficePage.content
              .map((ho) => ({ id: ho?.id, name: ho?.name || ho?.headOfficeName || '' }))
              .filter((ho) => ho.id != null && ho.name)
              .sort((a, b) => String(a.name).localeCompare(String(b.name)))
          : [],
      )
      setSchools(Array.isArray(schoolList) ? schoolList : [])
    } catch {
      setHeadOffices([])
      setSchools([])
    }
  }, [isSuperAdmin])

  const loadClassesAndSections = useCallback(async () => {
    if (!currentScopeForLookups.schoolId) {
      setClasses([])
      setSections([])
      return
    }

    try {
      const classRows = await fetchClasses({ schoolId: currentScopeForLookups.schoolId })
      setClasses(Array.isArray(classRows) ? classRows : [])
    } catch {
      setClasses([])
    }

    if (pendingFilters.classId && pendingFilters.classId !== 'Select') {
      try {
        const sectionRows = await fetchSections({
          schoolId: currentScopeForLookups.schoolId,
          classId: pendingFilters.classId,
        })
        setSections(Array.isArray(sectionRows) ? sectionRows : [])
      } catch {
        setSections([])
      }
    } else {
      setSections([])
    }
  }, [currentScopeForLookups.schoolId, pendingFilters.classId])

  const loadCertificateTypeOptions = useCallback(async () => {
    if (!currentScopeForLookups.schoolId && !currentScopeForLookups.headOfficeId) {
      setCertificateTypes([])
      return
    }

    try {
      const rows = await fetchCertificateTypesLookup({
        headOfficeId: currentScopeForLookups.headOfficeId || undefined,
        schoolId: currentScopeForLookups.schoolId || undefined,
      })
      setCertificateTypes(Array.isArray(rows) ? rows : [])
    } catch {
      setCertificateTypes([])
    }
  }, [currentScopeForLookups.headOfficeId, currentScopeForLookups.schoolId])

  const loadStudents = useCallback(async () => {
    if (!hasSearched) return
    if (!selectedSchoolId || !filters.classId || filters.classId === 'Select' || !filters.certificateTypeId) {
      setStudents([])
      setTotalElements(0)
      setTotalPages(1)
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await fetchStudentsPage(currentPage - 1, rowsPerPage, {
        headOfficeId: selectedHeadOfficeId || undefined,
        schoolId: selectedSchoolId || undefined,
        classId: filters.classId !== 'Select' ? filters.classId : undefined,
        sectionId: filters.sectionId !== 'Select' ? filters.sectionId : undefined,
        search: debouncedSearch || undefined,
      })
      const content = Array.isArray(data?.content) ? data.content : []
      setStudents(content)
      setTotalElements(Number(data?.totalElements ?? content.length) || 0)
      setTotalPages(Math.max(1, Number(data?.totalPages ?? 1) || 1))
    } catch (err) {
      setStudents([])
      setTotalElements(0)
      setTotalPages(1)
      setError(err?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filters.certificateTypeId, filters.classId, filters.sectionId, hasSearched, rowsPerPage, selectedHeadOfficeId, selectedSchoolId])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void loadLookups()
  }, [loadLookups])

  useEffect(() => {
    void loadClassesAndSections()
  }, [loadClassesAndSections])

  useEffect(() => {
    void loadCertificateTypeOptions()
  }, [loadCertificateTypeOptions])

  useEffect(() => {
    if (!hasSearched) return
    void loadStudents()
  }, [hasSearched, loadStudents])

  useEffect(() => {
    if (!isSuperAdmin) return
    if (pendingFilters.headOfficeId) return
    if (authHeadOfficeId == null) return
    setPendingFilters((prev) => ({ ...prev, headOfficeId: String(authHeadOfficeId) }))
  }, [authHeadOfficeId, isSuperAdmin, pendingFilters.headOfficeId])

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return
    const next = String(authSchoolId)
    setPendingFilters((prev) => ({ ...prev, schoolId: next }))
    setFilters((prev) => ({ ...prev, schoolId: next }))
  }, [authSchoolId, isSchoolAdmin])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [rowsPerPage])

  useEffect(() => {
    if (!filters.certificateTypeId) return
    const exists = certificateTypeOptions.some((row) => String(row.id) === String(filters.certificateTypeId))
    if (!exists && certificateTypeOptions.length > 0) {
      setPendingFilters((prev) => ({ ...prev, certificateTypeId: '' }))
      setFilters((prev) => ({ ...prev, certificateTypeId: '' }))
    }
  }, [certificateTypeOptions, filters.certificateTypeId])

  const handlePendingFilterChange = (event) => {
    const { id, value } = event.target
    setPendingFilters((prev) => {
      if (id === 'headOfficeId') {
        return {
          ...prev,
          headOfficeId: value,
          schoolId: '',
          classId: 'Select',
          sectionId: 'Select',
          certificateTypeId: '',
        }
      }
      if (id === 'schoolId') {
        return {
          ...prev,
          schoolId: value,
          classId: 'Select',
          sectionId: 'Select',
          certificateTypeId: '',
        }
      }
      if (id === 'classId') {
        return {
          ...prev,
          classId: value,
          sectionId: 'Select',
        }
      }
      return { ...prev, [id]: value }
    })
    setError('')
  }

  const handleApplyFilters = (event) => {
    event.preventDefault()

    if (isSuperAdmin && !pendingFilters.headOfficeId) {
      setError('Head Office is required.')
      return
    }
    if ((isSuperAdmin || isHeadOfficeAdmin) && !pendingFilters.schoolId) {
      setError('School is required.')
      return
    }
    if (!pendingFilters.classId || pendingFilters.classId === 'Select') {
      setError('Class is required.')
      return
    }
    if (!pendingFilters.certificateTypeId) {
      setError('Certificate Type is required.')
      return
    }

    setError('')
    setFilters(pendingFilters)
    setCurrentPage(1)
    setHasSearched(true)
    setIsFindSidebarOpen(false)
  }

  const handleResetFilters = () => {
    const schoolId = isSchoolAdmin && authSchoolId != null ? String(authSchoolId) : ''
    const headOfficeId = isHeadOfficeAdmin && authHeadOfficeId != null ? String(authHeadOfficeId) : ''
    const next = {
      headOfficeId,
      schoolId,
      classId: 'Select',
      sectionId: 'Select',
      certificateTypeId: '',
    }
    setPendingFilters(next)
    setFilters(next)
    setStudents([])
    setCurrentPage(1)
    setTotalElements(0)
    setTotalPages(1)
    setHasSearched(false)
    setError('')
  }

  const loadExportRows = useCallback(async () => {
    if (!hasSearched || !selectedSchoolId || !filters.classId || filters.classId === 'Select' || !filters.certificateTypeId) {
      return []
    }
    return fetchAllStudentPages({
      headOfficeId: selectedHeadOfficeId || undefined,
      schoolId: selectedSchoolId || undefined,
      classId: filters.classId !== 'Select' ? filters.classId : undefined,
      sectionId: filters.sectionId !== 'Select' ? filters.sectionId : undefined,
      search: debouncedSearch || undefined,
    })
  }, [debouncedSearch, filters.certificateTypeId, filters.classId, filters.sectionId, hasSearched, selectedHeadOfficeId, selectedSchoolId])

  const exportColumns = useMemo(
    () => columnOptions.map((column) => ({ key: column.key, label: column.label })),
    [],
  )

  const mapExportRow = useCallback(
    (row) => ({
      schoolName: row?.schoolName || '',
      certificateType: selectedCertificateType?.certificateName || '',
      photo: row?.photoUrl || '',
      name: row?.name || '',
      admissionNo: row?.admissionNo || '',
      className: row?.className || '',
      section: row?.section || '',
      rollNo: row?.rollNo || '',
      phone: row?.phone || '',
      email: row?.email || '',
    }),
    [selectedCertificateType?.certificateName],
  )

  const pageInfo = useMemo(() => {
    if (!hasSearched) return 'Showing 0 - 0 of 0 entries'
    if (totalElements === 0) return 'Showing 0 - 0 of 0 entries'
    const start = (currentPage - 1) * rowsPerPage + 1
    const end = Math.min(currentPage * rowsPerPage, totalElements)
    return `Showing ${start} - ${end} of ${totalElements} entries`
  }, [currentPage, hasSearched, rowsPerPage, totalElements])

  const tableRows = useMemo(
    () =>
      students.map((row) => ({
        ...row,
        certificateType: selectedCertificateType?.certificateName || '-',
      })),
    [selectedCertificateType?.certificateName, students],
  )

  const handleGenerateCertificate = (row) => {
    if (!selectedCertificateType) {
      setError('Please select a certificate type before generating a certificate.')
      return
    }
    openCertificatePreview({
      student: {
        ...row,
        certificateType: selectedCertificateType.certificateName,
      },
      template: selectedCertificateType,
      schoolName: selectedSchool?.schoolName || authSchoolName || row?.schoolName || 'School',
      headOfficeName: authHeadOfficeName || '',
    })
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Generate Certificate</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => onNavigate?.('dashboard')}
            >
              Dashboard
            </button>
            <span className="text-secondary-light"> / Generate Certificate</span>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger border-0 radius-8 mb-16">{error}</div> : null}

      <div className="card h-100">
        <div className="card-body p-0 dataTable-wrapper">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-16 px-20 py-12 border-bottom border-neutral-200">
            <div className="d-flex flex-wrap align-items-center gap-16">
              <ExportDropdown
                rows={tableRows}
                loadRows={loadExportRows}
                columns={exportColumns}
                visibleColumns={visibleColumns}
                mapRow={mapExportRow}
                fileName="Generate_Certificate_List"
                sheetName="Certificates"
                pdfTitle="Generate Certificate"
                disabled={!hasSearched || loading}
                loading={loading}
              />

              <button
                type="button"
                className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
                onClick={() => {
                  setPendingFilters(filters)
                  setIsFindSidebarOpen(true)
                }}
              >
                <span className="d-flex align-items-center gap-1 text-secondary-light text-sm">
                  Find
                </span>
                <span>
                  <i className="ri-arrow-right-line"></i>
                </span>
              </button>

              <div className="dropdown">
                <button
                  type="button"
                  className="px-12 py-5-px border border-neutral-300 radius-8 d-flex align-items-center gap-20 bg-white"
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

              <RowsPerPageSelect
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value)
                  setCurrentPage(1)
                }}
                className="form-select form-select-sm w-auto border border-neutral-300 radius-8 text-secondary-light bg-white"
              />
            </div>

            <div className="position-relative">
              <input
                type="text"
                className="form-control ps-40 py-9 border border-neutral-300 radius-8 text-secondary-light"
                placeholder="Search student..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
              />
              <span className="position-absolute start-0 top-50 translate-middle-y ps-16 text-secondary-light">
                <i className="ri-search-line"></i>
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table bordered-table mb-0 data-table" style={{ minWidth: 1200 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 80 }}>
                    <div className="form-check style-check d-flex align-items-center">
                      <input type="checkbox" className="form-check-input" checked={false} readOnly />
                      <label className="form-check-label">S.L</label>
                    </div>
                  </th>
                  {visibleColumns.schoolName ? <th scope="col">School</th> : null}
                  {visibleColumns.certificateType ? <th scope="col">Certificate Type</th> : null}
                  {visibleColumns.photo ? <th scope="col">Photo</th> : null}
                  {visibleColumns.name ? <th scope="col">Name</th> : null}
                  {visibleColumns.admissionNo ? <th scope="col">Admission No</th> : null}
                  {visibleColumns.className ? <th scope="col">Class</th> : null}
                  {visibleColumns.section ? <th scope="col">Section</th> : null}
                  {visibleColumns.rollNo ? <th scope="col">Roll No</th> : null}
                  {visibleColumns.phone ? <th scope="col">Phone</th> : null}
                  {visibleColumns.email ? <th scope="col">Email</th> : null}
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {!hasSearched ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Use Find to select scope, class, and certificate type, then load students from the database.
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      Loading students...
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount + 2} className="text-center py-40 text-secondary-light">
                      No students found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, index) => (
                    <tr key={row?.id ?? `${row?.name || 'student'}-${index}`}>
                      <td className="fw-medium text-secondary-light">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      {visibleColumns.schoolName ? <td>{row.schoolName || '-'}</td> : null}
                      {visibleColumns.certificateType ? <td>{row.certificateType || '-'}</td> : null}
                      {visibleColumns.photo ? (
                        <td>
                          <div className="w-40-px h-40-px rounded-circle bg-neutral-100 d-flex align-items-center justify-content-center overflow-hidden">
                            {row.photoUrl ? (
                              <img
                                src={row.photoUrl}
                                alt={row.name || 'student'}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <i className="ri-user-line text-secondary-light text-xl"></i>
                            )}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.name ? <td className="fw-medium text-primary-light">{row.name || '-'}</td> : null}
                      {visibleColumns.admissionNo ? <td>{row.admissionNo || '-'}</td> : null}
                      {visibleColumns.className ? <td>{row.className || '-'}</td> : null}
                      {visibleColumns.section ? <td>{row.section || '-'}</td> : null}
                      {visibleColumns.rollNo ? <td>{row.rollNo || '-'}</td> : null}
                      {visibleColumns.phone ? <td>{row.phone || '-'}</td> : null}
                      {visibleColumns.email ? <td>{row.email || '-'}</td> : null}
                      <td>
                        <div className="d-flex align-items-center gap-10">
                          <button
                            type="button"
                            className="bg-success-focus bg-hover-success-200 text-success-600 fw-medium w-32-px h-32-px d-flex align-items-center justify-content-center rounded-circle border-0"
                            title="Generate Certificate"
                            onClick={() => handleGenerateCertificate(row)}
                            disabled={!selectedCertificateType}
                          >
                            <i className="ri-award-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            paginationProps={{
              currentPage,
              totalPages: Math.max(1, totalPages),
              setCurrentPage,
              pageInfo,
            }}
          />
        </div>
      </div>

      <SlideSidebar
        isOpen={isFindSidebarOpen}
        title="Find Students"
        onClose={() => setIsFindSidebarOpen(false)}
        className="filter-sidebar"
      >
        <form className="p-20 d-grid grid-cols-2 gap-16" onSubmit={handleApplyFilters}>
          {isSuperAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ManualScopeSelectors
                enabled
                headOffices={headOffices}
                schoolOptions={scopeSchoolOptions}
                selectedHeadOfficeId={pendingFilters.headOfficeId}
                onHeadOfficeChange={(value) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    headOfficeId: value,
                    schoolId: '',
                    classId: 'Select',
                    sectionId: 'Select',
                    certificateTypeId: '',
                  }))
                }
                selectedSchoolId={pendingFilters.schoolId}
                onSchoolChange={(value) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    schoolId: value,
                    classId: 'Select',
                    sectionId: 'Select',
                    certificateTypeId: '',
                  }))
                }
                compact
              />
            </div>
          ) : isHeadOfficeAdmin ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">Head Office</label>
              <input className="form-control" value={authHeadOfficeName || `Head Office ${authHeadOfficeId || ''}`} readOnly />
            </div>
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-sm fw-semibold text-primary-light d-inline-block mb-8">School</label>
              <input className="form-control" value={authSchoolName || selectedSchool?.schoolName || 'Current school'} readOnly />
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="schoolId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              School <span className="text-danger-600">*</span>
            </label>
            <select
              id="schoolId"
              className="form-control form-select"
              value={pendingFilters.schoolId}
              onChange={handlePendingFilterChange}
              disabled={isSchoolAdmin}
            >
              <option value="">--Select School--</option>
              {scopeSchoolOptions.map((school) => (
                <option key={String(school.id)} value={String(school.id)}>
                  {school.schoolName || school.name || `School ${school.id}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="classId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Class <span className="text-danger-600">*</span>
            </label>
            <select
              id="classId"
              className="form-control form-select"
              value={pendingFilters.classId}
              onChange={handlePendingFilterChange}
              disabled={!pendingFilters.schoolId}
            >
              <option value="Select">--Select Class--</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="sectionId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Section
            </label>
            <select
              id="sectionId"
              className="form-control form-select"
              value={pendingFilters.sectionId}
              onChange={handlePendingFilterChange}
              disabled={!pendingFilters.schoolId || pendingFilters.classId === 'Select'}
            >
              <option value="Select">--Select Section--</option>
              {sectionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="certificateTypeId" className="text-sm fw-semibold text-primary-light d-inline-block mb-8">
              Certificate Type <span className="text-danger-600">*</span>
            </label>
            <select
              id="certificateTypeId"
              className="form-control form-select"
              value={pendingFilters.certificateTypeId}
              onChange={handlePendingFilterChange}
              disabled={!pendingFilters.schoolId}
            >
              <option value="">--Select Certificate Type--</option>
              {certificateTypeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-8 mt-12" style={{ gridColumn: '1 / -1' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-danger-200 text-danger-600 w-100"
            >
              Reset
            </button>
            <button type="submit" className="btn btn-primary-600 w-100">
              Apply
            </button>
          </div>
        </form>
      </SlideSidebar>
    </div>
  )
}

export default GenerateCertificate
