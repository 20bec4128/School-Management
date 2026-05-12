import { can } from '../utils/permissions'

const PermissionGuard = ({ user, permission, children, fallback = null }) => {
  if (!permission) return children
  if (can(user, permission)) return children
  return fallback
}

export default PermissionGuard

