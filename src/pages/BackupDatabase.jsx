import { useState } from "react";
import { apiFetch } from "../apis/apiClient";
import { useAuth } from "../context/useAuth";

const BackupDatabase = ({ onNavigate }) => {
  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};
  const { canAdd } = useAuth();
  const PAGE_SLUG = "backup-database";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownloadBackup = async () => {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/api/backup/download", {
        headers: { Accept: "application/octet-stream" },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate database backup (${response.status})`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "school_management_backup.sql";
      if (contentDisposition && contentDisposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Database backup successfully compiled and downloaded!");
    } catch (err) {
      setError(err?.message || "Failed to download database backup");
    } finally {
      setBusy(false);
    }
  };

  // Modern Premium Aesthetics
  const cardStyle = {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)",
    overflow: "hidden",
  };

  const gradientHeader = {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "24px 32px",
    color: "#ffffff",
  };

  const statusBadge = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "500",
    background: "#ecfdf5",
    color: "#059669",
    border: "1px solid #a7f3d0",
  };

  const mainButtonStyle = {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "none",
    padding: "16px 32px",
    borderRadius: "12px",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "16px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
  };

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Backup Database</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / Backup Database</span>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-8 mb-20 radius-8">
              <i className="ri-error-warning-line text-lg"></i>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success d-flex align-items-center gap-8 mb-20 radius-8">
              <i className="ri-checkbox-circle-line text-lg"></i>
              <span>{success}</span>
            </div>
          )}

          <div className="card bg-white" style={cardStyle}>
            <div style={gradientHeader}>
              <div className="d-flex align-items-center gap-12">
                <div
                  className="bg-primary-600 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.1)" }}
                >
                  <i className="ri-database-2-line text-xxl text-white"></i>
                </div>
                <div>
                  <h4 className="h5 mb-2 text-white fw-bold">Database Backup Manager</h4>
                  <p className="mb-0 text-neutral-300 text-sm">
                    Safely export the entire application data into a single sql file.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-32">
              <div className="d-flex flex-column gap-24">
                
                {/* Database Information Grid */}
                <div className="bg-neutral-50 rounded-12 p-20 border border-neutral-100">
                  <h6 className="fw-semibold text-primary-light mb-16 text-sm">Database Configuration</h6>
                  <div className="row g-16">
                    <div className="col-sm-6">
                      <div className="text-secondary-light text-xs mb-4-px">Database Engine</div>
                      <div className="fw-semibold text-primary-light text-sm d-flex align-items-center gap-6">
                        <i className="ri-instance-line text-primary-600"></i> PostgreSQL
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-secondary-light text-xs mb-4-px">Connection Status</div>
                      <div>
                        <span style={statusBadge}>
                          <span
                            className="bg-success-600 rounded-circle"
                            style={{
                              width: "8px",
                              height: "8px",
                              display: "inline-block",
                              animation: "pulse 2s infinite",
                            }}
                          />
                          Online
                        </span>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-secondary-light text-xs mb-4-px">Target Schema</div>
                      <div className="fw-semibold text-primary-light text-sm">public</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-secondary-light text-xs mb-4-px">Fallback Mode</div>
                      <div className="fw-semibold text-primary-light text-sm">High-Fidelity Auto Generator</div>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div
                  className="rounded-12 p-16 d-flex gap-12"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                >
                  <i className="ri-information-line text-xl text-primary-600"></i>
                  <div>
                    <h6 className="fw-semibold text-primary-900 text-sm mb-4-px">Database Security Notice</h6>
                    <p className="text-secondary-light text-xs mb-0">
                      The generated SQL script contains all schemas, schemas configuration, tables and record rows.
                      Please keep this file in a secure place.
                    </p>
                  </div>
                </div>

                {/* Download Button */}
                {canAdd(PAGE_SLUG) && (
                  <div className="text-center pt-16">
                    <button
                      type="button"
                      style={mainButtonStyle}
                      className="w-100 d-flex align-items-center justify-content-center gap-10 hover-scale"
                      onClick={handleDownloadBackup}
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Compiling Database Backup...</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-download-cloud-2-line text-xl"></i>
                          <span>Download Complete Backup (.SQL)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BackupDatabase;
