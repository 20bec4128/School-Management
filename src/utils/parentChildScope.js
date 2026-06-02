const normalizeId = (value) => {
  if (value == null) return null
  const text = String(value).trim()
  return text ? text : null
}

const firstDefined = (...values) => values.find((value) => value != null && String(value).trim() !== '')

export const getParentChildId = (child) =>
  normalizeId(
    firstDefined(
      child?.studentId,
      child?.id,
      child?.childId,
      child?.student?.studentId,
      child?.student?.childId,
      child?.student?.id,
    ),
  )

export const getParentChildName = (child) =>
  String(
    firstDefined(
      child?.name,
      child?.studentName,
      child?.fullName,
      child?.student?.name,
      child?.student?.fullName,
    ) || '',
  ).trim()

export const getParentChildSchoolId = (child) =>
  normalizeId(
    firstDefined(
      child?.schoolId,
      child?.school?.id,
      child?.school?.schoolId,
      child?.student?.schoolId,
      child?.student?.school?.id,
      child?.student?.school?.schoolId,
    ),
  )

export const getParentChildClassId = (child) =>
  normalizeId(
    firstDefined(
      child?.classId,
      child?.schoolClassId,
      child?.schoolClass?.id,
      child?.student?.classId,
      child?.student?.schoolClassId,
      child?.student?.schoolClass?.id,
    ),
  )

export const getParentChildSectionId = (child) =>
  normalizeId(
    firstDefined(
      child?.sectionId,
      child?.schoolSectionId,
      child?.schoolSection?.id,
      child?.student?.sectionId,
      child?.student?.schoolSectionId,
      child?.student?.schoolSection?.id,
    ),
  )

export const getParentChildScope = (children, selectedChildId) => {
  const list = Array.isArray(children) ? children.filter(Boolean) : []
  const normalizedSelectedChildId = normalizeId(selectedChildId)
  const selectedChild = normalizedSelectedChildId
    ? list.find((child) => String(getParentChildId(child) || '') === normalizedSelectedChildId) || null
    : null
  const selectedChildren = normalizedSelectedChildId
    ? (selectedChild ? [selectedChild] : [])
    : list
  const selectedChildIds = selectedChildren.map((child) => getParentChildId(child)).filter(Boolean)

  return {
    children: list,
    selectedChildId: normalizedSelectedChildId,
    selectedChild,
    selectedChildren,
    selectedChildIds,
    isAllChildrenSelected: normalizedSelectedChildId == null,
  }
}

export const dedupeByKey = (rows, keyFn) => {
  const items = Array.isArray(rows) ? rows : []
  const seen = new Set()
  const out = []

  items.forEach((row, index) => {
    const key = normalizeId(typeof keyFn === 'function' ? keyFn(row, index) : row?.id)
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push(row)
  })

  return out
}

export const uniqueScopeCombos = (children, keyFn) => {
  const list = Array.isArray(children) ? children : []
  const seen = new Set()
  const combos = []

  list.forEach((child) => {
    const key = normalizeId(typeof keyFn === 'function' ? keyFn(child) : '')
    if (!key || seen.has(key)) return
    seen.add(key)
    combos.push(child)
  })

  return combos
}
