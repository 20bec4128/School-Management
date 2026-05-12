import AccessDenied from '../pages/AccessDenied'
import { can } from '../utils/permissions'

const ProtectedPage = ({ user, permission, children }) => {
  if (!permission) return children
  if (can(user, permission)) return children
  return <AccessDenied />
}

export default ProtectedPage

