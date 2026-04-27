// Use the Vite dev-server proxy (`/api` -> backend) to avoid browser CORS issues.
const STUDENT_TYPE_API_BASE = '/api/student-types'

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

export const fetchStudentTypesPage = async (page, size) => {
  const query = new URLSearchParams({
    page: String(Math.max(page, 0)),
    size: String(size),
  })
  const res = await fetch(`${STUDENT_TYPE_API_BASE}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const fetchStudentTypesLookup = async () => {
  const firstPage = await fetchStudentTypesPage(0, 500)
  const firstContent = Array.isArray(firstPage?.content) ? firstPage.content : []
  const totalPages = Number.isFinite(firstPage?.totalPages) ? firstPage.totalPages : 1

  if (totalPages <= 1) {
    return Array.from(new Set(firstContent.map((item) => item?.studentType).filter(Boolean))).sort()
  }

  const pageRequests = []
  for (let page = 1; page < totalPages; page += 1) {
    pageRequests.push(fetchStudentTypesPage(page, 500))
  }

  const restPages = await Promise.all(pageRequests)
  const allContent = restPages.reduce((acc, item) => {
    if (Array.isArray(item?.content)) acc.push(...item.content)
    return acc
  }, [...firstContent])

  return Array.from(new Set(allContent.map((item) => item?.studentType).filter(Boolean))).sort()
}

export const createStudentType = async (payload) => {
  const res = await fetch(STUDENT_TYPE_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const updateStudentType = async (id, payload) => {
  const res = await fetch(`${STUDENT_TYPE_API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.json()
}

export const deleteStudentType = async (id) => {
  const res = await fetch(`${STUDENT_TYPE_API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await readApiError(res))
  return res.text()
}
