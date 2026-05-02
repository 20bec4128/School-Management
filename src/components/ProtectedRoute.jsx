import AccessDenied from '../pages/AccessDenied'
import { can } from '../utils/permissions'
import { normalizeRole } from '../utils/roles'

const ProtectedRoute = ({ user, role, allowedRoles, permission, children, fallback = null }) => {
  const effectiveRole = normalizeRole(role || user?.role || user?.userRole || user?.authority)

  // SUPER_ADMIN is all-access in the UI (backend remains source of truth for APIs).
  if (effectiveRole === 'SUPER_ADMIN') return children

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const ok = allowedRoles.map(normalizeRole).includes(effectiveRole)
    if (!ok) return fallback ?? <AccessDenied />
  }

  if (permission && !can(user, permission)) {
    return fallback ?? <AccessDenied />
  }

  return children
}

export default ProtectedRoute
