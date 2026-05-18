// Use the Vite dev-server proxy (`/api` -> backend) to avoid browser CORS issues.
import { apiFetch } from './apiClient'

const SCHOOLS_API_BASE = '/api/schools'

const readApiError = async (res) => {
  try {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      if (data?.message) return String(data.message)
      return `Request failed (${res.status})`
    }
    const text = await res.text()
    return text || `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

const buildUpsertFormData = (payload, form) => {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (form?.adminLogo instanceof File) fd.append('adminLogo', form.adminLogo)
  if (form?.frontendLogo instanceof File) fd.append('frontendLogo', form.frontendLogo)
  return fd
}

const isActiveSchoolRow = (row) => {
  const status = String(row?.status || '').trim().toUpperCase()
  const isDeleted = row?.isDeleted === true || String(row?.isDeleted || '').trim().toLowerCase() === 'true'
  return !isDeleted && (status === '' || status === 'ACTIVE')
}

export const fetchSchoolsPage = async (...args) => {
  const options = typeof args[0] === 'object' && args[0] !== null
    ? args[0]
    : {
        page: args[0],
        size: args[1],
        search: args[2] ?? '',
        statusFilter: args[3] ?? '',
        headOfficeId: args[4],
        schoolId: args[5],
      }

  const query = new URLSearchParams({
    page: String(Math.max(options.page ?? 0, 0)),
    size: String(options.size ?? 10),
  })
  if (options.search) query.append('search', options.search)
  if (options.statusFilter && options.statusFilter !== 'Select') query.append('status', options.statusFilter)
  if (options.headOfficeId != null && String(options.headOfficeId).trim() !== '') query.append('headOfficeId', String(options.headOfficeId))
  if (options.schoolId != null && String(options.schoolId).trim() !== '') query.append('schoolId', String(options.schoolId))

  const res = await apiFetch(`${SCHOOLS_API_BASE}?${query.toString()}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchSchoolNames = async () => {
  const firstPage = await fetchSchoolsPage(0, 500)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  const activeContent = firstContent.filter(isActiveSchoolRow)

  if (totalPages <= 1) {
    return Array.from(new Set(activeContent.map((s) => s?.schoolName).filter(Boolean))).sort()
  }

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchSchoolsPage(page, 500))
  }

  const restPages = await Promise.all(pageRequests)
  const allContent = restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...activeContent])

  return Array.from(new Set(allContent.filter(isActiveSchoolRow).map((s) => s?.schoolName).filter(Boolean))).sort()
}

export const fetchSchoolsLookup = async () => {
  const firstPage = await fetchSchoolsPage(0, 500)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1
  const activeFirstContent = firstContent.filter(isActiveSchoolRow)

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchSchoolsPage(page, 500))
  }
  const restPages = await Promise.all(pageRequests)

  const allContent = restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...activeFirstContent])

  const byId = new Map()
  for (const row of allContent) {
    if (!isActiveSchoolRow(row)) continue
    const id = row?.id
    const schoolName = row?.schoolName
    const headOfficeId = row?.headOfficeId ?? row?.headOffice?.id ?? null
    if (id == null || !schoolName) continue
    byId.set(String(id), { id, schoolName, headOfficeId })
  }

  return Array.from(byId.values()).sort((a, b) => a.schoolName.localeCompare(b.schoolName))
}

export const createSchool = async (payload, form) => {
  const res = await apiFetch(SCHOOLS_API_BASE, {
    method: 'POST',
    body: buildUpsertFormData(payload, form),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const createSchoolWithAdmin = async (payload, form) => {
  const fd = buildUpsertFormData(payload, form)
  const res = await apiFetch(`${SCHOOLS_API_BASE}/create-with-admin`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateSchool = async (schoolId, payload, form) => {
  const res = await apiFetch(`${SCHOOLS_API_BASE}/${schoolId}`, {
    method: 'PUT',
    body: buildUpsertFormData(payload, form),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSchool = async (schoolId) => {
  const res = await apiFetch(`${SCHOOLS_API_BASE}/${schoolId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
