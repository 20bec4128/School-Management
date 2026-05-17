import LeaveApplicationWorkspace from './LeaveApplicationWorkspace'

const AddLeaveApplication = ({ onNavigate }) => (
  <LeaveApplicationWorkspace
    onNavigate={onNavigate}
    pageTitle="Add Leave Application"
    breadcrumbLabel="Leave Application / Add"
    statusFilter={null}
    showCreateButton={false}
    showForm
    showTable={false}
    actionMode="crud"
    showStatusColumn
  />
)

export default AddLeaveApplication
