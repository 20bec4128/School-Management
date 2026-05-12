export default function AccessDenied({ title = 'Access Denied', message = "You don't have permission to view this page." }) {
  return (
    <div className="dashboard-main-body">
      <div className="card">
        <div className="card-body p-24">
          <h1 className="fw-semibold mb-8 h6 text-danger-600">{title}</h1>
          <div className="text-secondary-light">{message}</div>
        </div>
      </div>
    </div>
  )
}

