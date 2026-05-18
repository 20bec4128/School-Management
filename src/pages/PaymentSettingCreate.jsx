import { useEffect, useMemo, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import "../assets/css/addModalShared.css";
import {
  fetchPaymentSettingById,
  createPaymentSetting,
  updatePaymentSetting,
} from "../apis/paymentSettingApi";

const FIELD_ICONS = {
  "Head Office": "ri-building-line",
  "School Name": "ri-school-line",
  Gateway: "ri-wallet-line",
  "Paypal Email": "ri-mail-line",
  "Is Demo?": "ri-flask-line",
  "Extra Charge (%)": "ri-percent-line",
  "Is Active?": "ri-checkbox-circle-line",
  "Secret Key": "ri-key-line",
  "Publishable Key": "ri-lock-line",
  "Payumoney Key": "ri-key-line",
  "Key Salt": "ri-salt-line",
  "Merchant ID": "ri-store-line",
  "Working Key": "ri-settings-line",
  "Access Code": "ri-qr-code-line",
  "Merchant Key": "ri-key-line",
  "Merchant MID": "ri-id-card-line",
  Website: "ri-global-line",
  "Industry Type": "ri-bank-line",
  "Public Key": "ri-key-line",
  Password: "ri-lock-password-line",
  "Store ID": "ri-store-line",
  "User ID": "ri-user-line",
  "Submer Name": "ri-building-line",
  "Submer ID": "ri-id-card-line",
  "Terminal ID": "ri-terminal-line",
  "Client Key": "ri-key-line",
  "Server Key": "ri-server-line",
  "Api Key": "ri-api-line",
  "Auth Token": "ri-token-line",
  "Hash Key": "ri-key-line",
  "Vendor ID": "ri-store-line",
};

const gatewayOptions = [
  "PayPal",
  "Stripe",
  "PayUMoney",
  "CCAvenue",
  "PayTM",
  "PayStack",
  "JazzCash",
  "SSLCommerz",
  "DBBL",
  "Midtrans",
  "InstaMojo",
  "FlutterWave",
  "iPay",
];

const isActiveOptions = ["Select", "Yes", "No"];

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

const COMBINED_FORM_DEFAULT = {
  gateway: "PayPal",
  school: "",
  paypalEmail: "",
  secretKey: "",
  publishableKey: "",
  payumoneyKey: "",
  keySalt: "",
  merchantId: "",
  workingKey: "",
  accessCode: "",
  merchantKey: "",
  merchantMid: "",
  website: "",
  industryType: "",
  publicKey: "",
  password: "",
  storeId: "",
  userId: "",
  submerName: "",
  submerId: "",
  terminalId: "",
  clientKey: "",
  serverKey: "",
  apiKey: "",
  authToken: "",
  vendorId: "",
  hashKey: "",
  isDemo: "Yes",
  extraCharge: "",
  isActive: "Select",
};

const PaymentSettingCreate = ({ onNavigate }) => {
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

  const editId = useMemo(() => sessionStorage.getItem("PAYMENT_SETTING_EDIT_ID"), []);
  const isEditMode = Boolean(editId);

  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(COMBINED_FORM_DEFAULT);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
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
          const existing = await fetchPaymentSettingById(editId);
          if (existing) {
            setForm((prev) => ({
              ...prev,
              ...existing,
              school: existing.school || "",
              paypalEmail: existing.paypal || existing.paypalEmail || "",
              payumoneyKey: existing.payUMoney || existing.payumoneyKey || "",
              merchantId: existing.ccaVenue || existing.merchantId || "",
              merchantMid: existing.payTM || existing.merchantMid || "",
              secretKey: existing.payStack || existing.secretKey || "",
            }));
          }
        }
      } catch (err) {
        setError("Error loading system configurations.");
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
    if (form.gateway === "PayPal" && !form.paypalEmail.trim()) return "Paypal Email is required";
    if (form.gateway === "Stripe") {
      if (!form.secretKey.trim()) return "Secret Key is required";
      if (!form.publishableKey.trim()) return "Publishable Key is required";
    }
    if (form.gateway === "PayUMoney") {
      if (!form.payumoneyKey.trim()) return "Payumoney Key is required";
      if (!form.keySalt.trim()) return "Key Salt is required";
    }
    if (form.gateway === "CCAvenue") {
      if (!form.merchantId.trim()) return "Merchant ID is required";
      if (!form.workingKey.trim()) return "Working Key is required";
      if (!form.accessCode.trim()) return "Access Code is required";
    }
    if (form.gateway === "PayTM") {
      if (!form.merchantKey.trim()) return "Merchant Key is required";
      if (!form.merchantMid.trim()) return "Merchant MID is required";
      if (!form.website.trim()) return "Website is required";
      if (!form.industryType.trim()) return "Industry Type is required";
    }
    if (form.gateway === "PayStack") {
      if (!form.secretKey.trim()) return "Secret Key is required";
      if (!form.publicKey.trim()) return "Public Key is required";
    }
    if (form.gateway === "JazzCash") {
      if (!form.merchantId.trim()) return "Merchant ID is required";
      if (!form.password.trim()) return "Password is required";
      if (!form.keySalt.trim()) return "Key Salt is required";
    }
    if (form.gateway === "SSLCommerz") {
      if (!form.storeId.trim()) return "Store ID is required";
      if (!form.password.trim()) return "Password is required";
    }
    if (form.gateway === "DBBL") {
      if (!form.userId.trim()) return "User ID is required";
      if (!form.password.trim()) return "Password is required";
      if (!form.submerName.trim()) return "Submer Name is required";
      if (!form.submerId.trim()) return "Submer ID is required";
      if (!form.terminalId.trim()) return "Terminal ID is required";
    }
    if (form.gateway === "Midtrans") {
      if (!form.clientKey.trim()) return "Client Key is required";
      if (!form.serverKey.trim()) return "Server Key is required";
    }
    if (form.gateway === "InstaMojo") {
      if (!form.apiKey.trim()) return "Api Key is required";
      if (!form.authToken.trim()) return "Auth Token is required";
      if (!form.keySalt.trim()) return "Key Salt is required";
    }
    if (form.gateway === "FlutterWave") {
      if (!form.publicKey.trim()) return "Public Key is required";
      if (!form.secretKey.trim()) return "Secret Key is required";
    }
    if (form.gateway === "iPay") {
      if (!form.vendorId.trim()) return "Vendor ID is required";
      if (!form.hashKey.trim()) return "Hash Key is required";
    }
    if (form.isActive === "Select") return "Is Active? is required";
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
      // Find matching school in loaded schools array
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
        await updatePaymentSetting(editId, payload);
      } else {
        await createPaymentSetting(payload);
      }

      setSuccess(true);
      sessionStorage.removeItem("PAYMENT_SETTING_EDIT_ID");
      setTimeout(() => onNavigate?.("payment-setting"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to commit payment settings config.");
    } finally {
      setSaving(false);
    }
  };

  const renderGatewayFields = () => {
    const gateway = form.gateway;

    if (gateway === "PayPal") {
      return (
        <>
          <FormField label="Paypal Email" required full>
            <input
              type="email"
              className="form-control ps-40"
              id="paypalEmail"
              placeholder="Paypal Email"
              value={form.paypalEmail}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "Stripe") {
      return (
        <>
          <FormField label="Secret Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="secretKey"
              placeholder="Secret Key"
              value={form.secretKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Publishable Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="publishableKey"
              placeholder="Publishable Key"
              value={form.publishableKey}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "PayUMoney") {
      return (
        <>
          <FormField label="Payumoney Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="payumoneyKey"
              placeholder="Payumoney Key"
              value={form.payumoneyKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Key Salt" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="keySalt"
              placeholder="Key Salt"
              value={form.keySalt}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "CCAvenue") {
      return (
        <>
          <FormField label="Merchant ID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="merchantId"
              placeholder="Merchant ID"
              value={form.merchantId}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Working Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="workingKey"
              placeholder="Working Key"
              value={form.workingKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Access Code" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="accessCode"
              placeholder="Access Code"
              value={form.accessCode}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "PayTM") {
      return (
        <>
          <FormField label="Merchant Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="merchantKey"
              placeholder="Merchant Key"
              value={form.merchantKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Merchant MID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="merchantMid"
              placeholder="Merchant MID"
              value={form.merchantMid}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Website" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="website"
              placeholder="Website"
              value={form.website}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Industry Type" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="industryType"
              placeholder="Industry Type"
              value={form.industryType}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "PayStack") {
      return (
        <>
          <FormField label="Secret Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="secretKey"
              placeholder="Secret Key"
              value={form.secretKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Public Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="publicKey"
              placeholder="Public Key"
              value={form.publicKey}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "JazzCash") {
      return (
        <>
          <FormField label="Merchant ID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="merchantId"
              placeholder="Merchant ID"
              value={form.merchantId}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Password" required full>
            <input
              type="password"
              className="form-control ps-40"
              id="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Key Salt" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="keySalt"
              placeholder="Key Salt"
              value={form.keySalt}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "SSLCommerz") {
      return (
        <>
          <FormField label="Store ID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="storeId"
              placeholder="Store ID"
              value={form.storeId}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Password" required full>
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

    if (gateway === "DBBL") {
      return (
        <>
          <FormField label="User ID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="userId"
              placeholder="User ID"
              value={form.userId}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Password" required full>
            <input
              type="password"
              className="form-control ps-40"
              id="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Submer Name" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="submerName"
              placeholder="Submer Name"
              value={form.submerName}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Submer ID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="submerId"
              placeholder="Submer ID"
              value={form.submerId}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Terminal ID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="terminalId"
              placeholder="Terminal ID"
              value={form.terminalId}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "Midtrans") {
      return (
        <>
          <FormField label="Client Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="clientKey"
              placeholder="Client Key"
              value={form.clientKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Server Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="serverKey"
              placeholder="Server Key"
              value={form.serverKey}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "InstaMojo") {
      return (
        <>
          <FormField label="Api Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="apiKey"
              placeholder="Api Key"
              value={form.apiKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Auth Token" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="authToken"
              placeholder="Auth Token"
              value={form.authToken}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Key Salt" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="keySalt"
              placeholder="Key Salt"
              value={form.keySalt}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "FlutterWave") {
      return (
        <>
          <FormField label="Public Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="publicKey"
              placeholder="Public Key"
              value={form.publicKey}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Secret Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="secretKey"
              placeholder="Secret Key"
              value={form.secretKey}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    if (gateway === "iPay") {
      return (
        <>
          <FormField label="Vendor ID" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="vendorId"
              placeholder="Vendor ID"
              value={form.vendorId}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Hash Key" required full>
            <input
              type="text"
              className="form-control ps-40"
              id="hashKey"
              placeholder="Hash Key"
              value={form.hashKey}
              onChange={handleChange}
            />
          </FormField>
        </>
      );
    }

    return null;
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? "Edit Payment Setting" : "Add Payment Setting"}
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
              / Payment Setting / {isEditMode ? "Edit" : "Add"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("payment-setting")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && <div className="alert alert-danger mb-24 radius-8">{error}</div>}
      {success && (
        <div className="alert alert-success mb-24 radius-8">
          Payment Settings configuration successfully compiled! Redirecting...
        </div>
      )}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-16">
          <h2 className="h6 mb-0 text-primary-light">Payment Gateway Settings</h2>
        </div>

        <div className="card-body p-24">
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

              <FormField label="Is Demo?" required>
                <select
                  className="form-control form-select ps-40"
                  id="isDemo"
                  value={form.isDemo}
                  onChange={handleChange}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>

              <FormField label="Extra Charge (%)">
                <input
                  type="number"
                  className="form-control ps-40"
                  id="extraCharge"
                  placeholder="Extra Charge (%)"
                  value={form.extraCharge}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Is Active?" required>
                <select
                  className="form-control form-select ps-40"
                  id="isActive"
                  value={form.isActive}
                  onChange={handleChange}
                >
                  {isActiveOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "Select" ? "--Select--" : option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-10 mt-24">
              <button
                type="button"
                className="btn btn-light border"
                onClick={() => onNavigate?.("payment-setting")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600"
                disabled={saving}
              >
                {saving ? "Saving..." : isEditMode ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingCreate;
