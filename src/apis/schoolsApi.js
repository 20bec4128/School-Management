// Use the Vite dev-server proxy (`/api` -> backend) to avoid browser CORS issues.
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

export const fetchSchoolsPage = async (page, size) => {
  const query = new URLSearchParams({
    page: String(Math.max(page, 0)),
    size: String(size),
  })
  const res = await fetch(`${SCHOOLS_API_BASE}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchSchoolNames = async () => {
  const firstPage = await fetchSchoolsPage(0, 500)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1

  if (totalPages <= 1) {
    return Array.from(new Set(firstContent.map((s) => s?.schoolName).filter(Boolean))).sort()
  }

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchSchoolsPage(page, 500))
  }

  const restPages = await Promise.all(pageRequests)
  const allContent = restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstContent])

  return Array.from(new Set(allContent.map((s) => s?.schoolName).filter(Boolean))).sort()
}

export const fetchSchoolsLookup = async () => {
  const firstPage = await fetchSchoolsPage(0, 500)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchSchoolsPage(page, 500))
  }
  const restPages = await Promise.all(pageRequests)

  const allContent = restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstContent])

  const byId = new Map()
  for (const row of allContent) {
    const id = row?.id
    const schoolName = row?.schoolName
    if (id == null || !schoolName) continue
    byId.set(String(id), { id, schoolName })
  }

  return Array.from(byId.values()).sort((a, b) => a.schoolName.localeCompare(b.schoolName))
}

export const createSchool = async (payload, form) => {
  const res = await fetch(SCHOOLS_API_BASE, {
    method: 'POST',
    body: buildUpsertFormData(payload, form),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateSchool = async (schoolId, payload, form) => {
  const res = await fetch(`${SCHOOLS_API_BASE}/${schoolId}`, {
    method: 'PUT',
    body: buildUpsertFormData(payload, form),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteSchool = async (schoolId) => {
  const res = await fetch(`${SCHOOLS_API_BASE}/${schoolId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
