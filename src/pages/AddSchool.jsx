import React, { useState, useEffect, useRef, useCallback } from "react";
import { createSchoolWithAdmin, updateSchool } from "../apis/schoolsApi";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { fetchSubscriptionPlans } from "../apis/subscriptionPlansApi";
import { useAuth } from "../context/useAuth";
import PhoneCodeField from "../components/PhoneCodeField";
import "../assets/css/addModalShared.css";

const TABS = ["Basic Information", "Setting Information", "Social Information", "Other Information"];
const EDIT_STORAGE_KEY = "manage-school-edit-row";
const DEFAULT_PHONE_CODE = "+91";
const PHONE_LENGTH_BY_ISO = {
  IN: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  GB: { min: 10, max: 10 },
  AU: { min: 9, max: 9 },
  DE: { min: 10, max: 11 },
  CA: { min: 10, max: 10 },
  FR: { min: 9, max: 9 },
  BR: { min: 10, max: 11 },
};
const DEFAULT_PHONE_LENGTH = { min: 6, max: 15 };
const CURRENCIES = [
  { code: "INR", symbol: "\u20B9", label: "INR - Indian Rupee" },
  { code: "USD", symbol: "$", label: "USD - US Dollar" },
  { code: "EUR", symbol: "\u20AC", label: "EUR - Euro" },
  { code: "GBP", symbol: "\u00A3", label: "GBP - British Pound" },
  { code: "BDT", symbol: "\u09F3", label: "BDT - Bangladeshi Taka" },
  { code: "AED", symbol: "\u062F.\u0625", label: "AED - UAE Dirham" },
  { code: "AUD", symbol: "A$", label: "AUD - Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "CAD - Canadian Dollar" },
  { code: "CNY", symbol: "\u00A5", label: "CNY - Chinese Yuan" },
  { code: "JPY", symbol: "\u00A5", label: "JPY - Japanese Yen" },
  { code: "SAR", symbol: "\uFDFC", label: "SAR - Saudi Riyal" },
  { code: "SGD", symbol: "S$", label: "SGD - Singapore Dollar" },
  { code: "PKR", symbol: "\u20A8", label: "PKR - Pakistani Rupee" },
];

const toFlagEmoji = (iso = "") =>
  String(iso || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");

const combinePhoneValue = (code, number) => {
  const normalizedNumber = String(number || "").replace(/\D/g, "").trim();
  const normalizedCode = String(code || DEFAULT_PHONE_CODE).trim() || DEFAULT_PHONE_CODE;
  return normalizedNumber ? `${normalizedCode} ${normalizedNumber}` : normalizedCode;
};

const splitPhoneValue = (fullValue) => {
  const trimmed = String(fullValue || "").trim();
  if (!trimmed) return { code: DEFAULT_PHONE_CODE, number: "" };
  if (!trimmed.startsWith("+")) return { code: DEFAULT_PHONE_CODE, number: trimmed.replace(/\D/g, "") };

  const parts = trimmed.split(/\s+/);
  const code = parts[0] || DEFAULT_PHONE_CODE;
  const number = parts.slice(1).join("").replace(/\D/g, "");
  return { code, number };
};

const emptyForm = {
  // Basic Information
  schoolUrl: "",
  schoolCode: "",
  schoolName: "",
  subscription: "",
  isDemo: "No",
  status: "Active",
  adminUsername: "",
  adminPassword: "",
  headOfficeId: "",
  address: "",
  phone: "",
  registrationDate: "",
  email: "",
  fax: "",
  footer: "",
  // Setting Information
  currency: "",
  currencySymbol: "",
  enableFrontend: "Yes",
  examFinalResult: "Average of All Exam",
  language: "English",
  theme: "Default",
  onlineAdmission: "Yes",
  enableRTL: "No",
  zoomApiKey: "",
  zoomSecret: "",
  googleMapUrl: "",
  // Social Information
  facebookUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  instagramUrl: "",
  pinterestUrl: "",
  // Other Information
  frontendLogo: null,
  adminLogo: null,
};

const mapSchoolRowToForm = (row = {}) => ({
  schoolUrl: row.schoolUrl || "",
  schoolCode: row.schoolCode || "",
  schoolName: row.schoolName || "",
  subscription: row.subscription || "",
  isDemo: row.isDemo || "No",
  status: row.status || "Active",
  adminUsername: row.adminUsername || "",
  adminPassword: "",
  headOfficeId:
    row.headOfficeId != null
      ? String(row.headOfficeId)
      : row.headOffice?.id != null
        ? String(row.headOffice.id)
        : "",
  address: row.address || "",
  phone: splitPhoneValue(row.phone).number,
  registrationDate: row.registrationDate || "",
  email: row.email || "",
  fax: row.fax || "",
  footer: row.footer || "",
  currency: row.currency || "",
  currencySymbol: row.currencySymbol || "",
  enableFrontend: row.enableFrontend || "Yes",
  examFinalResult: row.examFinalResult || "Average of All Exam",
  language: row.language || "English",
  theme: row.theme || "Default",
  onlineAdmission: row.onlineAdmission || "Yes",
  enableRTL: row.enableRTL || "No",
  zoomApiKey: row.zoomApiKey || "",
  zoomSecret: row.zoomSecret || "",
  googleMapUrl: row.googleMapUrl || "",
  facebookUrl: row.facebookUrl || "",
  twitterUrl: row.twitterUrl || "",
  linkedinUrl: row.linkedinUrl || "",
  youtubeUrl: row.youtubeUrl || "",
  instagramUrl: row.instagramUrl || "",
  pinterestUrl: row.pinterestUrl || "",
  frontendLogo: null,
  adminLogo: null,
});

const FIELD_ICONS = {
  "School URL": "ri-link",
  "School Code": "ri-barcode-box-line",
  "School Name": "ri-school-line",
  Address: "ri-map-pin-line",
  Phone: "ri-phone-line",
  "Registration Date": "ri-calendar-line",
  Email: "ri-mail-line",
  Fax: "ri-printer-line",
  Footer: "ri-file-text-line",
  Currency: "ri-coin-line",
  "Currency Symbol": "ri-money-dollar-circle-line",
  "Enable Frontend": "ri-global-line",
  "Exam Final Result": "ri-bar-chart-2-line",
  Language: "ri-translate",
  Theme: "ri-palette-line",
  "Online Admission": "ri-computer-line",
  "Enable RTL": "ri-layout-right-line",
  "Zoom API Key": "ri-vidicon-line",
  "Zoom Secret": "ri-lock-password-line",
  "Google Map URL": "ri-map-2-line",
  "Facebook URL": "ri-facebook-box-line",
  "Twitter URL": "ri-twitter-x-line",
  "Linkedin URL": "ri-linkedin-box-line",
  "Youtube URL": "ri-youtube-line",
  "Instagram URL": "ri-instagram-line",
  "Pinterest URL": "ri-pinterest-line",
  "School Admin Username": "ri-user-3-line",
  "School Admin Password": "ri-lock-password-line",
  "Head Office": "ri-building-line",
};

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={full ? "col-12 mb-20" : "col-md-6 mb-20"}>
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#667085",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const ImageUploadField = ({ label, id, onChange }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(id, file);
    }
  };

  return (
    <div className="col-md-6 mb-20">
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">
        {label}
      </label>
      <div
        className="border border-neutral-300 radius-8 p-16 text-center cursor-pointer"
        style={{ minHeight: 140, background: "#f9fafb", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ maxHeight: 100, maxWidth: "100%", borderRadius: 6 }}
          />
        ) : (
          <>
            <i className="ri-image-add-line text-3xl text-secondary-light d-block mb-8" />
            <span className="text-xs text-secondary-light">Click to upload {label}</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.svg,.webp"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
};

const AddSchool = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: currentHeadOfficeId,
    headOfficeName: currentHeadOfficeName,
    status,
    pagePermissions,
    isSuperAdminRole,
  } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [headOffices, setHeadOffices] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  const [originalAdminUsername, setOriginalAdminUsername] = useState("");
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);
  const redirectTimerRef = useRef(null);

  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const isHeadOfficeScoped = String(role || "").toUpperCase() === "HEAD_OFFICE_ADMIN";
  const canViewSubscriptionPlans = status === "ready" && (isSuperAdminRole || pagePermissions?.["subscription-plans"]?.view === true);

  useEffect(() => {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
    if (!raw) return;

    try {
      const row = JSON.parse(raw);
      if (row?.id != null) {
        const parsedPhone = splitPhoneValue(row.phone);
        setEditingSchoolId(String(row.id));
        setOriginalAdminUsername(row.adminUsername || "");
        setPhoneCode(parsedPhone.code);
        setForm({ ...emptyForm, ...mapSchoolRowToForm({ ...row, phone: parsedPhone.number }) });
        setActiveTab(0);
      }
    } catch {
      sessionStorage.removeItem(EDIT_STORAGE_KEY);
      return;
    }

    sessionStorage.removeItem(EDIT_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const loadHeadOffices = async () => {
      if (!isSuperAdmin) {
        if (isHeadOfficeScoped && currentHeadOfficeId != null && currentHeadOfficeName) {
          setHeadOffices([{ id: currentHeadOfficeId, name: currentHeadOfficeName }]);
          setForm((prev) => ({
            ...prev,
            headOfficeId: prev.headOfficeId ? prev.headOfficeId : String(currentHeadOfficeId),
          }));
        }
        return;
      }
      try {
        const page = await fetchHeadOfficesPage(0, 500);
        setHeadOffices(Array.isArray(page?.content) ? page.content : []);
      } catch {
        setHeadOffices([]);
      }
    };
    void loadHeadOffices();
  }, [currentHeadOfficeId, currentHeadOfficeName, isHeadOfficeScoped, isSuperAdmin]);

  useEffect(() => {
    const loadSubscriptionPlans = async () => {
      if (!canViewSubscriptionPlans) {
        setSubscriptionPlans([]);
        return;
      }
      try {
        const plans = await fetchSubscriptionPlans();
        setSubscriptionPlans(Array.isArray(plans) ? plans : []);
      } catch {
        setSubscriptionPlans([]);
      }
    };
    void loadSubscriptionPlans();
  }, [canViewSubscriptionPlans]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [id]: value };
      if (id === "currency") {
        const matchedCurrency = CURRENCIES.find((item) => item.code === value);
        if (matchedCurrency) {
          next.currencySymbol = matchedCurrency.symbol;
        }
      }
      return next;
    });
  };

  const handleFileChange = (id, file) => {
    setForm((prev) => ({ ...prev, [id]: file }));
  };

  const validateCurrentTab = () => {
    setError("");
    if (activeTab === 0) {
      if (!form.schoolUrl.trim()) return "School URL is required";
      if (!form.schoolName.trim()) return "School Name is required";
      if (isSuperAdmin && !form.headOfficeId) return "Head Office is required";
      if (!form.adminUsername.trim()) return "School Admin Username is required";
      if (!isEditing && !form.adminPassword.trim()) return "School Admin Password is required";
      if (!form.subscription.trim()) return "Subscription is required";
      if (!form.email.trim()) return "Email is required";
      if (!form.phone.trim()) return "Phone is required";
      if (!form.address.trim()) return "Address is required";
    }
    // Add validation for other tabs if needed (currently none required)
    return null;
  };

  const handleTabChange = (index) => {
    if (index > activeTab) {
      const err = validateCurrentTab();
      if (err) {
        setError(err);
        return;
      }
    }
    setActiveTab(index);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    const isEditing = Boolean(editingSchoolId);
    const err = validateCurrentTab();
    if (err) {
      setError(err);
      return;
    }

    if (activeTab < TABS.length - 1) {
      setActiveTab(activeTab + 1);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        subscription: form.subscription.trim(),
        headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
        phone: combinePhoneValue(phoneCode, form.phone),
        status: form.status.toUpperCase(),
      };

      if (isEditing) {
        const editPayload = {
          ...payload,
        };
        if (form.adminUsername && form.adminUsername !== originalAdminUsername) {
          editPayload.adminUsername = form.adminUsername;
        } else {
          delete editPayload.adminUsername;
        }
        if (!String(form.adminPassword || "").trim()) {
          delete editPayload.adminPassword;
        }
        await updateSchool(editingSchoolId, editPayload, form);
      } else {
        await createSchoolWithAdmin(
          {
            school: payload,
            admin: { username: form.adminUsername, password: form.adminPassword },
          },
          form
        );
      }

      setSuccess(true);
      redirectTimerRef.current = setTimeout(() => onNavigate("manage-school"), 2000);
    } catch (err) {
      setError(err?.message || (isEditing ? "Failed to update school" : "Failed to create school"));
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(editingSchoolId);

  useEffect(() => {
    if (editingSchoolId || form.subscription || subscriptionPlans.length === 0) return;
    setForm((prev) => ({
      ...prev,
      subscription: subscriptionPlans[0]?.planName || "",
    }));
  }, [editingSchoolId, form.subscription, subscriptionPlans]);

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">{isEditing ? "Edit School" : "Add School"}</h1>
          <span className="text-secondary-light">
            Administrator / Manage School / {isEditing ? "Edit School" : "Add School"}
          </span>
        </div>
        <button className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate("manage-school")}>
          <i className="ri-arrow-left-line"></i> Back to Schools
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8" role="alert">
          <i className="ri-checkbox-circle-line text-lg" />
          {isEditing ? "School updated successfully! Redirecting..." : "School created successfully! Redirecting..."}
        </div>
      )}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(i)}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === i ? "2px solid var(--primary-600, #4f46e5)" : "2px solid transparent",
                color: activeTab === i ? "var(--primary-600, #4f46e5)" : "var(--secondary-light, #667085)",
                fontWeight: activeTab === i ? 600 : 400,
                padding: "14px 20px",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body p-24">
          <form 
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
          >
            {/* ═══ TAB 0 – Basic Information ═══ */}
            {activeTab === 0 && (
              <div className="row">
                <FormField label="Head Office" required full>
                  {isSuperAdmin ? (
                    <select id="headOfficeId" className="form-control form-select" value={form.headOfficeId} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                      <option value="">--Select Head Office--</option>
                      {headOffices.map((ho) => (
                        <option key={ho.id} value={String(ho.id)}>{ho.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" className="form-control" value={currentHeadOfficeName || ""} disabled style={{ paddingLeft: '2.5rem' }} />
                  )}
                </FormField>
                <FormField label="School URL" required   >
                  <input
                    type="text"
                    id="schoolUrl"
                    className="form-control"
                    placeholder="south-point OR liverpool"
                    value={form.schoolUrl}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </FormField>

                <FormField label="School Code" >
                  <input
                    type="text"
                    id="schoolCode"
                    className="form-control"
                    placeholder="Enter school code"
                    value={form.schoolCode}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </FormField>

                <FormField label="School Name" required >
                  <input
                    type="text"
                    id="schoolName"
                    className="form-control"
                    placeholder="Enter school name"
                    value={form.schoolName}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </FormField>

                

                <FormField label="School Admin Username" required>
                  <input type="text" id="adminUsername" className="form-control" placeholder="Admin username" value={form.adminUsername} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                </FormField>

                <FormField label="School Admin Password" required={!isEditing}>
                  <input
                    type="password"
                    id="adminPassword"
                    className="form-control"
                    placeholder={isEditing ? "Leave blank to keep current password" : "Admin password"}
                    value={form.adminPassword}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </FormField>

                <FormField label="Subscription" required>
                  {canViewSubscriptionPlans ? (
                    <select id="subscription" className="form-control form-select" value={form.subscription} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                      <option value="">--Select Plan--</option>
                      {subscriptionPlans.map((plan) => (
                        <option key={plan.id} value={plan.planName}>
                          {plan.planName}
                        </option>
                      ))}
                      {form.subscription && !subscriptionPlans.some((plan) => plan.planName === form.subscription) ? (
                        <option value={form.subscription}>{form.subscription} (Legacy)</option>
                      ) : null}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="subscription"
                      className="form-control"
                      placeholder="Subscription plan name"
                      value={form.subscription}
                      onChange={handleChange}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  )}
                </FormField>

                <FormField label="Is Demo?" required>
                  <select id="isDemo" className="form-control form-select" value={form.isDemo} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </FormField>

                <FormField label="Status" required>
                  <select id="status" className="form-control form-select" value={form.status} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </FormField>

                <FormField label="Registration Date">
                  <input type="date" id="registrationDate" className="form-control" value={form.registrationDate} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                </FormField>

                <FormField label="Email" required >
                  <input type="email" id="email" className="form-control" placeholder="school@example.com" value={form.email} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                </FormField>

                <div className="col-md-6 mb-20">
                  <PhoneCodeField
                    id="phone"
                    label="Phone number"
                    required
                    code={phoneCode}
                    value={form.phone}
                    onCodeChange={setPhoneCode}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                  />
                </div>

                <FormField label="Fax">
                  <input type="text" id="fax" className="form-control" placeholder="Fax number" value={form.fax} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                </FormField>

                <FormField label="Address" required full>
                  <textarea id="address" rows={2} className="form-control" placeholder="Enter full address" value={form.address} onChange={handleChange} style={{ paddingLeft: '2.5rem', paddingTop: '0.65rem' }} />
                </FormField>

                <FormField label="Footer" full>
                  <textarea id="footer" rows={2} className="form-control" placeholder="Enter footer text" value={form.footer} onChange={handleChange} style={{ paddingLeft: '2.5rem', paddingTop: '0.65rem' }} />
                </FormField>
              </div>
            )}

            {/* ═══ TAB 1 – Setting Information ═══ */}
            {activeTab === 1 && (
              <div className="row">
                <FormField label="Currency">
                  <select id="currency" className="form-control form-select" value={form.currency} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="">Select currency</option>
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.label}
                      </option>
                    ))}
                    {form.currency && !CURRENCIES.some((currency) => currency.code === form.currency) && (
                      <option value={form.currency}>{form.currency}</option>
                    )}
                  </select>
                </FormField>

                <FormField label="Currency Symbol">
                  <select id="currencySymbol" className="form-control form-select" value={form.currencySymbol} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="">Select symbol</option>
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.symbol}>
                        {currency.symbol} ({currency.code})
                      </option>
                    ))}
                    {form.currencySymbol && !CURRENCIES.some((currency) => currency.symbol === form.currencySymbol) && (
                      <option value={form.currencySymbol}>{form.currencySymbol}</option>
                    )}
                  </select>
                </FormField>

                <FormField label="Language">
                  <select id="language" className="form-control form-select" value={form.language} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </FormField>

                <FormField label="Theme">
                  <select id="theme" className="form-control form-select" value={form.theme} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="Default">Default</option>
                    <option value="Modern">Modern</option>
                    <option value="Classic">Classic</option>
                  </select>
                </FormField>

                <FormField label="Enable Frontend">
                  <select id="enableFrontend" className="form-control form-select" value={form.enableFrontend} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </FormField>

                <FormField label="Enable RTL">
                  <select id="enableRTL" className="form-control form-select" value={form.enableRTL} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </FormField>

                <FormField label="Exam Final Result" full>
                  <select id="examFinalResult" className="form-control form-select" value={form.examFinalResult} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="Average of All Exam">Average of All Exam</option>
                    <option value="Highest Mark">Highest Mark</option>
                    <option value="Grade Only">Grade Only</option>
                  </select>
                </FormField>

                <FormField label="Online Admission">
                  <select id="onlineAdmission" className="form-control form-select" value={form.onlineAdmission} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </FormField>

                <FormField label="Google Map URL" full>
                  <input type="url" id="googleMapUrl" className="form-control" placeholder="https://google.com/maps/..." value={form.googleMapUrl} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                </FormField>

                <FormField label="Zoom API Key">
                  <input type="text" id="zoomApiKey" className="form-control" placeholder="Zoom Key" value={form.zoomApiKey} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                </FormField>

                <FormField label="Zoom Secret">
                  <input type="text" id="zoomSecret" className="form-control" placeholder="Zoom Secret" value={form.zoomSecret} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                </FormField>
              </div>
            )}

            {/* ═══ TAB 2 – Social Information ═══ */}
            {activeTab === 2 && (
              <div className="row">
                {["Facebook URL", "Twitter URL", "Linkedin URL", "Youtube URL", "Instagram URL", "Pinterest URL"].map((label) => {
                  const id = label.charAt(0).toLowerCase() + label.slice(1).replace(" URL", "Url");
                  return (
                    <FormField key={id} label={label}>
                      <input type="url" id={id} className="form-control" placeholder={`Enter ${label}`} value={form[id]} onChange={handleChange} style={{ paddingLeft: '2.5rem' }} />
                    </FormField>
                  );
                })}
              </div>
            )}

            {/* ═══ TAB 3 – Other Information ═══ */}
            {activeTab === 3 && (
              <div className="row">
                <ImageUploadField label="Frontend Logo" id="frontendLogo" onChange={handleFileChange} />
                <ImageUploadField label="Admin Logo" id="adminLogo" onChange={handleFileChange} />
              </div>
            )}

            {/* ─── Footer Buttons ─── */}
            <div className="d-flex align-items-center justify-content-between mt-24 pt-20 border-top border-neutral-200">
              <button
                type="button"
                className="btn btn-light border px-20"
                onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
                disabled={activeTab === 0}
              >
                <i className="ri-arrow-left-line me-6" /> Previous
              </button>

              <div className="d-flex align-items-center gap-10">
                {activeTab < TABS.length - 1 ? (
                  <button
                    key="btn-next"
                    type="button"
                    className="btn btn-primary-600 px-20"
                    onClick={() => handleTabChange(activeTab + 1)}
                  >
                    Next <i className="ri-arrow-right-line ms-6" />
                  </button>
                ) : (
                  <button
                    key="btn-submit"
                    type="submit"
                    className="btn btn-primary-600 px-24"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-8" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line me-6" /> {isEditing ? "Update School" : "Save School"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSchool;
