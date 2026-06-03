import { useEffect, useMemo, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import "../assets/css/addModalShared.css";
import {
  createEmailSetting,
  fetchEmailSettingById,
  updateEmailSetting,
} from "../apis/emailSettingApi";

const FIELD_ICONS = {
  "Head Office": "ri-building-line",
  "School Name": "ri-school-line",
  "Email Protocol": "ri-mail-line",
  "SMTP Host": "ri-server-line",
  "SMTP Port": "ri-hashtag",
  "SMTP Username": "ri-user-line",
  "SMTP Password": "ri-lock-password-line",
  "SMTP Security": "ri-shield-keyhole-line",
  "SMTP Timeout": "ri-timer-line",
  "Email Type": "ri-mail-open-line",
  "Char Set": "ri-font-size",
  Priority: "ri-price-tag-3-line",
  "From Name": "ri-user-smile-line",
  "From Email": "ri-mail-send-line",
};

const emailProtocolOptions = ["SMTP", "PHPMailer", "Sendmail", "Mailgun"];
const emailTypeOptions = ["HTML", "Text"];
const charSetOptions = ["UTF-8", "ISO-8859-1", "Windows-1252"];
const smtpSecurityOptions = ["None", "SSL", "TLS"];
const priorityOptions = ["Low", "Normal", "High"];

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {!noIcon ? (
        <div className="avm-input-with-icon" style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#667085",
              fontSize: "0.95rem",
              lineHeight: 1,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <i className={icon}></i>
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

const emptyForm = {
  headOfficeId: "",
  schoolId: "",
  emailProtocol: "",
  smtpHost: "",
  smtpPort: "",
  smtpUsername: "",
  smtpPassword: "",
  smtpSecurity: "",
  smtpTimeout: "",
  emailType: "",
  charSet: "",
  priority: "",
  fromName: "",
  fromEmail: "",
};

const EMAIL_SETTING_EDIT_STORAGE_KEY = "EMAIL_SETTING_EDIT_ID";

const EmailSettingCreate = ({ onNavigate }) => {
  const {
    role: authRole,
    user,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();

  const role = useMemo(
    () =>
      normalizeRole(
        authRole || user?.role || user?.userRole || user?.authority,
      ),
    [authRole, user],
  );
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isHeadOfficeAdmin = role === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

  const editId = useMemo(
    () => sessionStorage.getItem(EMAIL_SETTING_EDIT_STORAGE_KEY),
    [],
  );
  const isEditMode = Boolean(editId);

  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : [];
    if (isSuperAdmin) return manualScope.schoolOptions || [];
    if (isHeadOfficeAdmin) {
      return list.filter(
        (school) =>
          String(school?.headOfficeId ?? "") === String(authHeadOfficeId ?? ""),
      );
    }
    if (isSchoolAdmin) {
      const match = list.find(
        (school) => String(school?.id ?? "") === String(authSchoolId ?? ""),
      );
      if (match) return [match];
      if (authSchoolId != null) {
        return [
          {
            id: authSchoolId,
            schoolName: authSchoolName || "My School",
            headOfficeId: authHeadOfficeId ?? null,
          },
        ];
      }
      return [];
    }
    return list;
  }, [
    schools,
    isSuperAdmin,
    manualScope.schoolOptions,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    authHeadOfficeId,
    authSchoolId,
    authSchoolName,
  ]);

  useEffect(() => {
    const loadData = async () => {
      if (isSchoolAdmin) {
        setSchools(
          authSchoolId != null
            ? [
                {
                  id: authSchoolId,
                  schoolName: authSchoolName || `School ${authSchoolId}`,
                  headOfficeId: authHeadOfficeId ?? null,
                },
              ]
            : [],
        );
        return;
      }
      try {
        const lookupData = await fetchSchoolsLookup();
        setSchools(Array.isArray(lookupData) ? lookupData : []);

        if (isEditMode && editId) {
          const existing = await fetchEmailSettingById(editId);
          if (existing) {
            setForm({
              headOfficeId:
                existing.headOfficeId != null
                  ? String(existing.headOfficeId)
                  : "",
              schoolId:
                existing.schoolId != null ? String(existing.schoolId) : "",
              emailProtocol: existing.emailProtocol || "",
              smtpHost: existing.smtpHost || "",
              smtpPort:
                existing.smtpPort != null ? String(existing.smtpPort) : "",
              smtpUsername: existing.smtpUsername || "",
              smtpPassword: existing.smtpPassword || "",
              smtpSecurity: existing.smtpSecurity || "",
              smtpTimeout:
                existing.smtpTimeout != null
                  ? String(existing.smtpTimeout)
                  : "",
              emailType: existing.emailType || "",
              charSet: existing.charSet || "",
              priority: existing.priority || "",
              fromName: existing.fromName || "",
              fromEmail: existing.fromEmail || "",
            });

            if (isSuperAdmin && existing.schoolId) {
              const match = lookupData.find(
                (school) => String(school.id) === String(existing.schoolId),
              );
              manualScope.setSelectedScope(
                match?.headOfficeId != null ? String(match.headOfficeId) : "",
                String(existing.schoolId),
              );
            }
          }
        }
      } catch (err) {
        setError("Error loading email setting dependencies.");
      }
    };

    void loadData();
  }, [authHeadOfficeId, authSchoolId, authSchoolName, editId, isEditMode, isSchoolAdmin]);

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return;
    setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }));
  }, [authSchoolId, isSchoolAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || isEditMode || !manualScope.selectedSchoolId) return;
    setForm((prev) => ({
      ...prev,
      schoolId: String(manualScope.selectedSchoolId),
    }));
  }, [isSuperAdmin, isEditMode, manualScope.selectedSchoolId]);

  const resolveSchoolName = () => {
    const match = schoolOptions.find(
      (school) => String(school.id) === String(form.schoolId),
    );
    return match ? match.schoolName : "Selected School";
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSchoolChange = (value) => {
    setForm((prev) => ({ ...prev, schoolId: value }));
    if (isSuperAdmin) {
      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value);
    }
  };

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedScope(value, "");
    setForm((prev) => ({ ...prev, headOfficeId: value, schoolId: "" }));
  };

  const validate = () => {
    if (!form.schoolId) return "School Name is required";
    if (!form.emailProtocol) return "Email Protocol is required";
    if (!form.smtpHost.trim()) return "SMTP Host is required";
    if (!form.smtpPort) return "SMTP Port is required";
    if (!form.smtpUsername.trim()) return "SMTP Username is required";
    if (!form.smtpPassword.trim()) return "SMTP Password is required";
    if (!form.emailType) return "Email Type is required";
    if (!form.charSet) return "Char Set is required";
    if (!form.fromName.trim()) return "From Name is required";
    if (!form.fromEmail.trim()) return "From Email is required";

    if (form.smtpTimeout) {
      const timeout = Number(form.smtpTimeout);
      if (Number.isNaN(timeout) || timeout < 5 || timeout > 10) {
        return "SMTP Timeout must be between 5 and 10 seconds";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    const selectedSchool = schoolOptions.find(
      (school) => String(school.id) === String(form.schoolId),
    );
    const resolvedHeadOfficeId =
      selectedSchool?.headOfficeId != null
        ? Number(selectedSchool.headOfficeId)
        : form.headOfficeId
          ? Number(form.headOfficeId)
          : authHeadOfficeId
            ? Number(authHeadOfficeId)
            : null;

    const payload = {
      headOfficeId: resolvedHeadOfficeId,
      schoolId: Number(form.schoolId),
      schoolName: resolveSchoolName(),
      emailProtocol: form.emailProtocol,
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort),
      smtpUsername: form.smtpUsername.trim(),
      smtpPassword: form.smtpPassword.trim(),
      smtpSecurity: form.smtpSecurity || null,
      smtpTimeout: form.smtpTimeout ? Number(form.smtpTimeout) : null,
      emailType: form.emailType,
      charSet: form.charSet,
      priority: form.priority || null,
      fromName: form.fromName.trim(),
      fromEmail: form.fromEmail.trim(),
    };

    try {
      if (isEditMode) {
        await updateEmailSetting(editId, payload);
      } else {
        await createEmailSetting(payload);
      }

      setSuccessMessage(
        `Email setting ${isEditMode ? "updated" : "saved"} successfully! Redirecting...`,
      );
      setSuccess(true);
      sessionStorage.removeItem(EMAIL_SETTING_EDIT_STORAGE_KEY);
      setTimeout(() => onNavigate?.("email-setting"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to save email setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? "Edit Email Setting" : "Add Email Setting"}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light">
              {" "}
              / Email Setting / {isEditMode ? "Edit" : "Add"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("email-setting")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="alert alert-danger mb-24 radius-8">{error}</div> : null}
      {success ? (
        <div className="alert alert-success mb-24 radius-8">{successMessage}</div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-24">
          <form className="avm-grid" onSubmit={handleSubmit}>
            {isSuperAdmin ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <ManualScopeSelectors
                  enabled={isSuperAdmin}
                  headOffices={manualScope.headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                  onHeadOfficeChange={handleHeadOfficeChange}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={handleSchoolChange}
                  compact
                />
              </div>
            ) : (
              <FormField label="School Name" required full>
                <select
                  className="form-control form-select ps-40"
                  id="schoolId"
                  value={form.schoolId}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  disabled={isSchoolAdmin}
                >
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName || school.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Email Protocol" required>
              <select
                className="form-control form-select ps-40"
                id="emailProtocol"
                value={form.emailProtocol}
                onChange={handleChange}
              >
                <option value="">--Select --</option>
                {emailProtocolOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="SMTP Host" required>
              <input
                type="text"
                className="form-control ps-40"
                id="smtpHost"
                placeholder="SMTP Host"
                value={form.smtpHost}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="SMTP Port" required>
              <input
                type="number"
                className="form-control ps-40"
                id="smtpPort"
                placeholder="SMTP Port"
                value={form.smtpPort}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="SMTP Username" required>
              <input
                type="text"
                className="form-control ps-40"
                id="smtpUsername"
                placeholder="SMTP Username"
                value={form.smtpUsername}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="SMTP Password" required>
              <input
                type="password"
                className="form-control ps-40"
                id="smtpPassword"
                placeholder="SMTP Password"
                value={form.smtpPassword}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="SMTP Security">
              <select
                className="form-control form-select ps-40"
                id="smtpSecurity"
                value={form.smtpSecurity}
                onChange={handleChange}
              >
                <option value="">--Select --</option>
                {smtpSecurityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="SMTP Timeout">
              <input
                type="number"
                className="form-control ps-40"
                id="smtpTimeout"
                placeholder="SMTP Timeout"
                value={form.smtpTimeout}
                onChange={handleChange}
              />
            </FormField>

            <div className="avm-field full">
              <div className="text-secondary-light text-sm mb-8">
                SMTP Timeout (in seconds) [ 5 - 10 ].
              </div>
            </div>

            <FormField label="Email Type" required>
              <select
                className="form-control form-select ps-40"
                id="emailType"
                value={form.emailType}
                onChange={handleChange}
              >
                <option value="">--Select --</option>
                {emailTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Char Set" required>
              <select
                className="form-control form-select ps-40"
                id="charSet"
                value={form.charSet}
                onChange={handleChange}
              >
                <option value="">--Select --</option>
                {charSetOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Priority">
              <select
                className="form-control form-select ps-40"
                id="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="">--Select --</option>
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="From Name" required>
              <input
                type="text"
                className="form-control ps-40"
                id="fromName"
                placeholder="From Name"
                value={form.fromName}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="From Email" required>
              <input
                type="email"
                className="form-control ps-40"
                id="fromEmail"
                placeholder="From Email"
                value={form.fromEmail}
                onChange={handleChange}
              />
            </FormField>

            <div className="d-flex justify-content-between align-items-center mt-24 full">
              <div />
              <div className="d-flex gap-10">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => onNavigate?.("email-setting")}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-600" disabled={saving}>
                  {saving ? "Saving..." : isEditMode ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingCreate;
