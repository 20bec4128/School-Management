import LeaveApplicationWorkspace from './LeaveApplicationWorkspace'

const WaitingApplication = () => (
  <LeaveApplicationWorkspace
    pageTitle="Waiting Application"
    breadcrumbLabel="Waiting Application"
    statusFilter="PENDING"
    showCreateButton={false}
    showForm={false}
    actionMode="review"
    showStatusColumn={false}
  />
)

export default WaitingApplication
