import LeaveApplicationWorkspace from './LeaveApplicationWorkspace'

const ApprovedApplication = () => (
  <LeaveApplicationWorkspace
    pageTitle="Approved Application"
    breadcrumbLabel="Approved Application"
    statusFilter="APPROVED"
    showCreateButton={false}
    showForm={false}
    actionMode="view"
    showStatusColumn={false}
  />
)

export default ApprovedApplication
