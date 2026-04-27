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
