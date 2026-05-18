import { useEffect, useMemo, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import "../assets/css/addModalShared.css";
import {
  fetchSmsSettingById,
  createSmsSetting,
  updateSmsSetting,
} from "../apis/smsSettingApi";

const COMBINED_FORM_DEFAULT = {
  gateway: "Twilio",
  school: "",
  accountSid: "",
  authToken: "",
  fromNumber: "",
  username: "",
  password: "",
  apiKey: "",
  moNumber: "",
  authId: "",
  hashKey: "",
  senderId: "",
  authKey: "",
  router: "",
  smsType: "Text",
  isActive: "Yes",
};

const gatewayOptions = [
  "Twilio",
  "Clicktell",
  "Bulk",
  "MSG91",
  "Plivo",
  "TextLocal",
  "SMSCountry",
  "BetaSMS",
  "BulkPK",
  "SMSCluster",
  "AlphaNet",
  "BDBulk",
  "MimSMS",
  "Bulk360",
  "SMSTo",
];

const smsTypeOptions = ["Text", "Unicode", "Flash"];

const FIELD_ICONS = {
  "Head Office": "ri-building-line",
  "School Name": "ri-school-line",
  Gateway: "ri-wallet-line",
  "Account SID": "ri-id-card-line",
  "Auth Token": "ri-key-line",
  "From Number": "ri-phone-line",
  "Is Active?": "ri-checkbox-circle-line",
  Username: "ri-user-line",
  Password: "ri-lock-password-line",
  "Api Key": "ri-api-line",
  "Mo Number": "ri-phone-line",
  "Auth ID": "ri-id-card-line",
  "Hash Key": "ri-key-line",
  "Sender ID": "ri-mail-send-line",
  "Auth Key": "ri-key-line",
  Router: "ri-router-line",
  "SMS Type": "ri-message-2-line",
};

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

const SmsSettingCreate = ({ onNavigate }) => {
  const {
    role: authRole,
    user,
    schoolName: authSchoolName,
    schoolId: authSchoolId,
    headOfficeId: authHeadOfficeId,
  } = useAuth();

  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user]
  );
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isHeadOfficeAdmin = role === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";

  const manualScope = useManualSchoolScope(isSuperAdmin);

  const editId = useMemo(() => sessionStorage.getItem("SMS_SETTING_EDIT_ID"), []);
  const isEditMode = Boolean(editId);

  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(COMBINED_FORM_DEFAULT);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isSchoolAdmin) {
          const singleSchool =
            authSchoolId != null
              ? [
                  {
                    id: Number(authSchoolId),
                    schoolName: authSchoolName || "My School",
                    headOfficeId: null,
                  },
                ]
              : [];
          setSchools(singleSchool);
        } else {
          const allSchools = await fetchSchoolsLookup();
          const accessibleSchools = isHeadOfficeAdmin
            ? allSchools.filter(
                (school) =>
                  String(school?.headOfficeId ?? "") === String(authHeadOfficeId)
              )
            : allSchools;
          setSchools(accessibleSchools);
        }

        if (isEditMode && editId) {
          const existing = await fetchSmsSettingById(editId);
          if (existing) {
            setForm((prev) => ({
              ...prev,
              ...existing,
              school: existing.school || "",
            }));
          }
        }
      } catch (err) {
        setError("Error loading system configurations.");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [isEditMode, editId, isSchoolAdmin, isHeadOfficeAdmin, authSchoolId, authSchoolName, authHeadOfficeId]);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    const list = Array.isArray(schools) ? schools : [];
    if (isHeadOfficeAdmin) {
      return list.filter(
        (school) =>
          String(school?.headOfficeId ?? "") === String(authHeadOfficeId)
      );
    }
    if (isSchoolAdmin) {
      return list.length > 0
        ? list
        : authSchoolId != null
        ? [
            {
              id: authSchoolId,
              schoolName: authSchoolName || "My School",
              headOfficeId: null,
            },
          ]
        : [];
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
    if (!isSuperAdmin || editId) return;
    const match = Array.isArray(manualScope.schoolOptions)
      ? manualScope.schoolOptions.find(
          (school) => String(school?.id ?? "") === String(manualScope.selectedSchoolId)
        )
      : null;
    setForm((prev) => ({
      ...prev,
      school: match ? match.schoolName : "",
    }));
  }, [isSuperAdmin, manualScope.selectedSchoolId, manualScope.schoolOptions, editId]);

  useEffect(() => {
    if (!isSuperAdmin || !editId || !form.school) return;
    const match = Array.isArray(manualScope.schoolOptions)
      ? manualScope.schoolOptions.find(
          (school) =>
            String(school?.schoolName ?? "").toLowerCase() === String(form.school).toLowerCase()
        )
      : null;
    if (!match) return;
    const hoId = match?.headOfficeId != null ? String(match.headOfficeId) : "";
    manualScope.setSelectedScope(hoId, String(match.id));
  }, [isSuperAdmin, editId, form.school, manualScope]);

  useEffect(() => {
    if (!isSchoolAdmin) return;
    setForm((prev) => ({
      ...prev,
      school: authSchoolName || "",
    }));
  }, [isSchoolAdmin, authSchoolName]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    if (!form.school) return "School Name is required";
    if (!form.gateway) return "Gateway type is required";

    const gateway = form.gateway;
    if (gateway === "Twilio") {
      if (!form.accountSid) return "Account SID is required";
      if (!form.authToken) return "Auth Token is required";
      if (!form.fromNumber) return "From Number is required";
    } else if (gateway === "Clicktell") {
      if (!form.username) return "Username is required";
      if (!form.password) return "Password is required";
      if (!form.apiKey) return "API Key is required";
      if (!form.fromNumber) return "From Number is required";
      if (!form.moNumber) return "MO Number is required";
    } else if (gateway === "Bulk" || gateway === "MSG91") {
      if (!form.username) return "Username is required";
      if (!form.password) return "Password is required";
    } else if (gateway === "Plivo") {
      if (!form.authId) return "Auth ID is required";
      if (!form.authToken) return "Auth Token is required";
      if (!form.fromNumber) return "From Number is required";
    } else if (gateway === "TextLocal") {
      if (!form.username) return "Username is required";
      if (!form.hashKey) return "Hash Key is required";
      if (!form.senderId) return "Sender ID is required";
    } else if (gateway === "SMSCountry" || gateway === "BetaSMS" || gateway === "BulkPK") {
      if (!form.username) return "Username is required";
      if (!form.password) return "Password is required";
      if (!form.senderId) return "Sender ID is required";
    } else if (gateway === "SMSCluster") {
      if (!form.authKey) return "Auth Key is required";
      if (!form.senderId) return "Sender ID is required";
      if (!form.router) return "Router is required";
    } else if (gateway === "AlphaNet") {
      if (!form.username) return "Username is required";
      if (!form.hashKey) return "Hash Key is required";
    } else if (gateway === "BDBulk") {
      if (!form.hashKey) return "Hash Key is required";
    } else if (gateway === "MimSMS") {
      if (!form.apiKey) return "API Key is required";
      if (!form.senderId) return "Sender ID is required";
    } else if (gateway === "Bulk360") {
      if (!form.username) return "Username is required";
      if (!form.password) return "Password is required";
      if (!form.fromNumber) return "From Number is required";
    } else if (gateway === "SMSTo") {
      if (!form.apiKey) return "API Key is required";
      if (!form.senderId) return "Sender ID is required";
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

    // Resolve schoolId and headOfficeId before submitting
    let resolvedSchoolId = null;
    let resolvedHeadOfficeId = null;

    if (isSuperAdmin) {
      resolvedSchoolId = manualScope.selectedSchoolId ? Number(manualScope.selectedSchoolId) : null;
      resolvedHeadOfficeId = manualScope.selectedHeadOfficeId ? Number(manualScope.selectedHeadOfficeId) : null;
    } else if (isSchoolAdmin) {
      resolvedSchoolId = authSchoolId != null ? Number(authSchoolId) : null;
      resolvedHeadOfficeId = authHeadOfficeId != null ? Number(authHeadOfficeId) : null;
    } else {
      const match = schools.find((s) => s.schoolName === form.school);
      if (match) {
        resolvedSchoolId = Number(match.id);
        resolvedHeadOfficeId = match.headOfficeId != null ? Number(match.headOfficeId) : null;
      }
    }

    const payload = {
      ...form,
      schoolId: resolvedSchoolId,
      headOfficeId: resolvedHeadOfficeId,
      schoolName: form.school,
    };

    try {
      if (isEditMode) {
        await updateSmsSetting(editId, payload);
      } else {
        await createSmsSetting(payload);
      }

      setSuccess(true);
      sessionStorage.removeItem("SMS_SETTING_EDIT_ID");
      setTimeout(() => onNavigate?.("sms-setting"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to save SMS settings configuration.");
    } finally {
      setSaving(false);
    }
  };

  const renderGatewayFields = () => {
    const gateway = form.gateway;

    if (gateway === "Twilio") {
      return (
        <>
          <FormField label="Account SID" required>
            <input
              type="text"
              className="form-control ps-40"
              id="accountSid"
              placeholder="Account SID"
              value={form.accountSid}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Auth Token" required>
            <input
              type="text"
              className="form-control ps-40"
              id="authToken"
              placeholder="Auth Token"
              value={form.authToken}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="From Number" required>
            <input
              type="text"
              className="form-control ps-40"
              id="fromNumber"
              placeholder="From Number"
              value={form.fromNumber}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "Clicktell") {
      return (
        <>
          <FormField label="Username" required>
            <input
              type="text"
              className="form-control ps-40"
              id="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              className="form-control ps-40"
              id="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Api Key" required>
            <input
              type="text"
              className="form-control ps-40"
              id="apiKey"
              placeholder="Api Key"
              value={form.apiKey}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="From Number" required>
            <input
              type="text"
              className="form-control ps-40"
              id="fromNumber"
              placeholder="From Number"
              value={form.fromNumber}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Mo Number" required>
            <input
              type="text"
              className="form-control ps-40"
              id="moNumber"
              placeholder="Mo Number"
              value={form.moNumber}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "Bulk" || gateway === "MSG91") {
      return (
        <>
          <FormField label="Username" required>
            <input
              type="text"
              className="form-control ps-40"
              id="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              className="form-control ps-40"
              id="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "Plivo") {
      return (
        <>
          <FormField label="Auth ID" required>
            <input
              type="text"
              className="form-control ps-40"
              id="authId"
              placeholder="Auth ID"
              value={form.authId}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Auth Token" required>
            <input
              type="text"
              className="form-control ps-40"
              id="authToken"
              placeholder="Auth Token"
              value={form.authToken}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="From Number" required>
            <input
              type="text"
              className="form-control ps-40"
              id="fromNumber"
              placeholder="From Number"
              value={form.fromNumber}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "TextLocal") {
      return (
        <>
          <FormField label="Username" required>
            <input
              type="text"
              className="form-control ps-40"
              id="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Hash Key" required>
            <input
              type="text"
              className="form-control ps-40"
              id="hashKey"
              placeholder="Hash Key"
              value={form.hashKey}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Sender ID" required>
            <input
              type="text"
              className="form-control ps-40"
              id="senderId"
              placeholder="Sender ID"
              value={form.senderId}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "SMSCountry" || gateway === "BetaSMS" || gateway === "BulkPK") {
      return (
        <>
          <FormField label="Username" required>
            <input
              type="text"
              className="form-control ps-40"
              id="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              className="form-control ps-40"
              id="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Sender ID" required>
            <input
              type="text"
              className="form-control ps-40"
              id="senderId"
              placeholder="Sender ID"
              value={form.senderId}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "SMSCluster") {
      return (
        <>
          <FormField label="Auth Key" required>
            <input
              type="text"
              className="form-control ps-40"
              id="authKey"
              placeholder="Auth Key"
              value={form.authKey}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Sender ID" required>
            <input
              type="text"
              className="form-control ps-40"
              id="senderId"
              placeholder="Sender ID"
              value={form.senderId}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Router" required>
            <input
              type="text"
              className="form-control ps-40"
              id="router"
              placeholder="Router"
              value={form.router}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "AlphaNet") {
      return (
        <>
          <FormField label="Username" required>
            <input
              type="text"
              className="form-control ps-40"
              id="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Hash Key" required>
            <input
              type="text"
              className="form-control ps-40"
              id="hashKey"
              placeholder="Hash Key"
              value={form.hashKey}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="SMS Type" required>
            <select
              className="form-control form-select ps-40"
              id="smsType"
              value={form.smsType}
              onChange={handleChange}
            >
              {smsTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      );
    }

    if (gateway === "BDBulk") {
      return (
        <>
          <FormField label="Hash Key" required>
            <input
              type="text"
              className="form-control ps-40"
              id="hashKey"
              placeholder="Hash Key"
              value={form.hashKey}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="SMS Type" required>
            <select
              className="form-control form-select ps-40"
              id="smsType"
              value={form.smsType}
              onChange={handleChange}
            >
              {smsTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      );
    }

    if (gateway === "MimSMS") {
      return (
        <>
          <FormField label="Api Key" required>
            <input
              type="text"
              className="form-control ps-40"
              id="apiKey"
              placeholder="Api Key"
              value={form.apiKey}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Sender ID" required>
            <input
              type="text"
              className="form-control ps-40"
              id="senderId"
              placeholder="Sender ID"
              value={form.senderId}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="SMS Type" required>
            <select
              className="form-control form-select ps-40"
              id="smsType"
              value={form.smsType}
              onChange={handleChange}
            >
              {smsTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        </>
      );
    }

    if (gateway === "Bulk360") {
      return (
        <>
          <FormField label="Username" required>
            <input
              type="text"
              className="form-control ps-40"
              id="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              className="form-control ps-40"
              id="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="From Number" required>
            <input
              type="text"
              className="form-control ps-40"
              id="fromNumber"
              placeholder="From Number"
              value={form.fromNumber}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "SMSTo") {
      return (
        <>
          <FormField label="Api Key" required>
            <input
              type="text"
              className="form-control ps-40"
              id="apiKey"
              placeholder="Api Key"
              value={form.apiKey}
              onChange={handleChange}
            />
          </FormField>

          <FormField label="Sender ID" required>
            <input
              type="text"
              className="form-control ps-40"
              id="senderId"
              placeholder="Sender ID"
              value={form.senderId}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    return null;
  };

  const handleCancel = () => {
    sessionStorage.removeItem("SMS_SETTING_EDIT_ID");
    onNavigate?.("sms-setting");
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? "Edit SMS Setting" : "Add SMS Setting"}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>
            <span
              className="text-secondary-light cursor-pointer"
              onClick={() => onNavigate?.("sms-setting")}
            >
              {" "}
              / SMS Setting
            </span>
            <span className="text-secondary-light">
              {" "}
              / {isEditMode ? "Edit" : "Add"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("sms-setting")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && <div className="alert alert-danger mb-24 radius-8">{error}</div>}
      {success && (
        <div className="alert alert-success mb-24 radius-8">
          SMS Settings configuration successfully compiled! Redirecting...
        </div>
      )}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-16">
          <h2 className="h6 mb-0 text-primary-light">SMS Gateway Settings</h2>
        </div>

        <div className="card-body p-24">
          {loading ? (
            <div className="text-center py-40">Loading settings configuration...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="avm-grid">
                {isSuperAdmin ? (
                  <FormField label="Head Office" required full>
                    <select
                      className="form-control form-select ps-40"
                      id="headOfficeId"
                      value={manualScope.selectedHeadOfficeId}
                      onChange={(e) => {
                        manualScope.setSelectedScope(e.target.value, "");
                        setForm((prev) => ({ ...prev, school: "" }));
                      }}
                    >
                      <option value="">--Select Head Office--</option>
                      {manualScope.headOffices.map((headOffice) => (
                        <option key={headOffice.id} value={String(headOffice.id)}>
                          {headOffice.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : null}

                <FormField label="School Name" required full>
                  <select
                    className="form-control form-select ps-40"
                    id="school"
                    value={isSuperAdmin ? manualScope.selectedSchoolId : form.school}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isSuperAdmin) {
                        manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, val);
                        const match = manualScope.schoolOptions.find((s) => String(s.id) === String(val));
                        setForm((prev) => ({ ...prev, school: match ? match.schoolName : "" }));
                      } else {
                        setForm((prev) => ({ ...prev, school: val }));
                      }
                    }}
                    disabled={isSchoolAdmin}
                  >
                    <option value="">--Select School--</option>
                    {isSuperAdmin ? (
                      schoolOptions.map((school) => (
                        <option key={school.id} value={String(school.id)}>
                          {school.schoolName}
                        </option>
                      ))
                    ) : (
                      schoolOptions.map((school) => {
                        const name = typeof school === "string" ? school : school.schoolName;
                        return (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        );
                      })
                    )}
                  </select>
                </FormField>

                <FormField label="Gateway" required full>
                  <select
                    className="form-control form-select ps-40"
                    id="gateway"
                    value={form.gateway}
                    onChange={handleChange}
                  >
                    {gatewayOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                {renderGatewayFields()}

                <FormField label="Is Active?" required id="isActive">
                  <select
                    className="form-control form-select ps-40"
                    id="isActive"
                    value={form.isActive}
                    onChange={handleChange}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </FormField>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-3 mt-24">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary border border-neutral-300 radius-8"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-600 radius-8"
                  disabled={saving}
                >
                  {saving ? "Saving..." : isEditMode ? "Update" : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsSettingCreate;
