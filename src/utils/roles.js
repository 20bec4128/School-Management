export const normalizeRole = (value) => {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw) return ''

  // Canonical role names used by the frontend.
  // Backend may still return older/alternate strings.
  if (raw === 'ADMIN' || raw === 'HEAD_OFFICE_ADMINISTRATOR' || raw === 'HEAD_OFFICE') {
    return 'HEAD_OFFICE_ADMIN'
  }
  if (raw === 'GUARDIAN') return 'PARENT'
  return raw
}

export const isRole = (role, target) => normalizeRole(role) === normalizeRole(target)

