const PAGE_PERMISSION_ALIASES = {
  'manage-school': 'school',
  'manage-teacher': 'teacher',
  'manage-award': 'award',
  'manage-designation': 'designation',
  'manage-employee': 'employee',
  'manage-feedback': 'feedback',
  onlineexam: 'online-exam',
}

export const normalizePagePermissionSlug = (slug) => {
  if (!slug) return slug
  const trimmed = String(slug).trim()
  return PAGE_PERMISSION_ALIASES[trimmed] || trimmed
}

