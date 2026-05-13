import LeaveApplicationWorkspace from './LeaveApplicationWorkspace'

const DeclineApplication = () => (
  <LeaveApplicationWorkspace
    pageTitle="Decline Application"
    breadcrumbLabel="Decline Application"
    statusFilter="DECLINED"
    showCreateButton={false}
    showForm={false}
    actionMode="view"
    showStatusColumn={false}
  />
)

export default DeclineApplication
