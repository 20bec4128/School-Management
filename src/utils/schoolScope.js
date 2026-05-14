export const normalizeSchoolIds = (schoolRows) => {
  const rows = Array.isArray(schoolRows) ? schoolRows : []
  return Array.from(
    new Set(
      rows
        .map((school) => String(school?.id ?? school?.schoolId ?? '').trim())
        .filter(Boolean),
    ),
  )
}

export const fetchRowsForSchoolIds = async (schoolIds, fetchBySchoolId) => {
  const ids = Array.isArray(schoolIds) ? schoolIds : []
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean)))

  if (uniqueIds.length === 0) {
    return []
  }

  const results = await Promise.allSettled(uniqueIds.map((schoolId) => fetchBySchoolId(schoolId)))
  return results.flatMap((result) => {
    if (result.status !== 'fulfilled') return []
    return Array.isArray(result.value) ? result.value : []
  })
}

export const uniqueBy = (rows, keyFn) => {
  const map = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = keyFn(row)
    if (key == null || String(key).trim() === '') continue
    const normalized = String(key)
    if (!map.has(normalized)) {
      map.set(normalized, row)
    }
  }
  return Array.from(map.values())
}

export const uniqueStrings = (values) => Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value ?? '').trim()).filter(Boolean)))

export const findSchoolById = (schoolRows, schoolId) => {
  const id = String(schoolId ?? '').trim()
  if (!id) return null
  return (Array.isArray(schoolRows) ? schoolRows : []).find((row) => String(row?.id ?? row?.schoolId ?? '').trim() === id) || null
}
