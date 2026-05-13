import LeaveApplicationWorkspace from './LeaveApplicationWorkspace'

const LeaveApplication = () => (
  <LeaveApplicationWorkspace
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
