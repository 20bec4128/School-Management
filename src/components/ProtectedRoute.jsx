import React from 'react'
import { useAuth } from '../context/useAuth'
import { can } from '../utils/permissions'

const ProtectedRoute = ({ children, allowedRoles, permission, pageKey, fallback }) => {
  const { user, role, canView, isSuperAdminRole } = useAuth()

  // 1. If user is not logged in, wait or redirect/show fallback
  if (!user) {
    return fallback || null
  }

  // 2. Super Admin role bypasses all checks
  if (isSuperAdminRole || role === 'SUPER_ADMIN') {
    return children
  }

  // 3. Allowed roles check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return fallback || null
    }
  }

  // 4. Flat permissions check
  if (permission) {
    if (!can(user, permission)) {
      return fallback || null
    }
  }

  // 5. Page visibility matrix check
  if (pageKey) {
    if (!canView(pageKey)) {
      return fallback || null
    }
  }

  return children
}

export default ProtectedRoute
