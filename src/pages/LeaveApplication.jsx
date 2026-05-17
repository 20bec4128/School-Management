import LeaveApplicationWorkspace from './LeaveApplicationWorkspace'

const LeaveApplication = ({ onNavigate }) => (
  <LeaveApplicationWorkspace
    onNavigate={onNavigate}
    pageTitle="Leave Application"
    breadcrumbLabel="Leave Application"
    statusFilter={null}
    showCreateButton
    showForm
    actionMode="crud"
    showStatusColumn
  />
)

export default LeaveApplication
