import React, { useState, useRef, useEffect, useMemo } from "react";
import "../assets/css/addModalShared.css";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import { fetchGeneralSettingBySchoolId, saveGeneralSetting } from "../apis/generalSettingApi";

/* ─── Static options ─── */
const LANGUAGES = [
  "English", "Arabic", "Bengali", "Chinese", "French", "German",
  "Hindi", "Indonesian", "Italian", "Japanese", "Korean", "Malay",
  "Persian", "Portuguese", "Russian", "Spanish", "Turkish", "Urdu",
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR – Indian Rupee" },
  { code: "USD", symbol: "$", label: "USD – US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR – Euro" },
  { code: "GBP", symbol: "£", label: "GBP – British Pound" },
  { code: "BDT", symbol: "৳", label: "BDT – Bangladeshi Taka" },
  { code: "AED", symbol: "د.إ", label: "AED – UAE Dirham" },
  { code: "AUD", symbol: "A$", label: "AUD – Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "CAD – Canadian Dollar" },
  { code: "CNY", symbol: "¥", label: "CNY – Chinese Yuan" },
  { code: "JPY", symbol: "¥", label: "JPY – Japanese Yen" },
  { code: "SAR", symbol: "﷼", label: "SAR – Saudi Riyal" },
  { code: "SGD", symbol: "S$", label: "SGD – Singapore Dollar" },
  { code: "PKR", symbol: "₨", label: "PKR – Pakistani Rupee" },
];

const THEMES = [
  { value: "navy-blue", label: "Navy Blue", color: "#1e3a8a" },
  { value: "purple", label: "Purple", color: "#7c3aed" },
  { value: "teal", label: "Teal", color: "#0d9488" },
  { value: "rose", label: "Rose", color: "#e11d48" },
  { value: "orange", label: "Orange", color: "#ea580c" },
  { value: "slate", label: "Slate Gray", color: "#475569" },
];

const TIMEZONES = [
  "(GMT+06:00) Dhaka",
  "(GMT-12:00) International Date Line West",
  "(GMT-11:00) Midway Island, Samoa",
  "(GMT-10:00) Hawaii",
  "(GMT-09:00) Alaska",
  "(GMT-08:00) Pacific Time (US & Canada)",
  "(GMT-07:00) Mountain Time (US & Canada)",
  "(GMT-06:00) Central Time (US & Canada)",
  "(GMT-05:00) Eastern Time (US & Canada)",
  "(GMT-04:00) Atlantic Time (Canada)",
  "(GMT-03:00) Buenos Aires, Georgetown",
  "(GMT-02:00) Mid-Atlantic",
  "(GMT-01:00) Azores, Cape Verde Is.",
  "(GMT+00:00) London, Dublin, Lisbon",
  "(GMT+01:00) Berlin, Paris, Rome, Madrid",
  "(GMT+02:00) Cairo, Jerusalem, Helsinki",
  "(GMT+03:00) Moscow, Kuwait, Riyadh",
  "(GMT+03:30) Tehran",
  "(GMT+04:00) Abu Dhabi, Muscat, Baku",
  "(GMT+04:30) Kabul",
  "(GMT+05:00) Islamabad, Karachi, Tashkent",
  "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
  "(GMT+05:45) Kathmandu",
  "(GMT+06:30) Rangoon",
  "(GMT+07:00) Bangkok, Hanoi, Jakarta",
  "(GMT+08:00) Beijing, Singapore, Taipei",
  "(GMT+09:00) Tokyo, Seoul, Osaka",
  "(GMT+09:30) Adelaide, Darwin",
  "(GMT+10:00) Sydney, Melbourne, Brisbane",
  "(GMT+11:00) Magadan, Solomon Is.",
  "(GMT+12:00) Auckland, Wellington, Fiji",
];

const DATE_FORMATS = [
  { value: "MMM DD, YYYY", label: "Jul 13, 2018" },
  { value: "DD/MM/YYYY", label: "13/07/2018" },
  { value: "MM/DD/YYYY", label: "07/13/2018" },
  { value: "YYYY-MM-DD", label: "2018-07-13" },
  { value: "DD-MM-YYYY", label: "13-07-2018" },
  { value: "DD.MM.YYYY", label: "13.07.2018" },
];

const GENERAL_FORM_DEFAULT = {
  brandName: "School Man Pro",
  brandTitle: "Infitoolz Schools Manager Pro",
  language: "English",
  currency: "INR",
  currencySymbol: "₹",
  enableRtl: "No",
  enableFrontend: "Yes",
  theme: "navy-blue",
  timeZone: "(GMT+06:00) Dhaka",
  dateFormat: "MMM DD, YYYY",
  brandLogo: "",
  faviconIcon: "",
  brandFooter: "Copyright © Infitoolz Schools Manager Pro",
  googleAnalytics: "",
};

/* ─── Reusable Field component ─── */
const Field = ({ label, required, icon, children, full = false }) => (
  <div className={full ? "col-12 mb-20" : "col-md-6 mb-20"}>
    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
      {label} {required && <span className="text-danger-600">*</span>}
    </label>
    <div style={{ position: "relative" }}>
      {icon && (
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
          <i className={icon} />
        </span>
      )}
      {children}
    </div>
  </div>
);

const inputCls = "form-control";
const selectCls = "form-control form-select";
const iStyle = { paddingLeft: "2.5rem" };

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
const GeneralSetting = () => {
  const {
    role: authRole,
    user,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
    canEdit,
  } = useAuth();

  const PAGE_SLUG = "general-settings";

  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user]
  );

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isHeadOfficeAdmin = role === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";

  const manualScope = useManualSchoolScope(isSuperAdmin || isHeadOfficeAdmin);

  const activeSchoolId = isSchoolAdmin ? authSchoolId : manualScope.selectedSchoolId;
  const activeHeadOfficeId = isSchoolAdmin ? authHeadOfficeId : manualScope.selectedHeadOfficeId;

  const [form, setForm] = useState(GENERAL_FORM_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch settings whenever selected school changes
  useEffect(() => {
    if (!activeSchoolId) {
      setForm(GENERAL_FORM_DEFAULT);
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchGeneralSettingBySchoolId(activeSchoolId);
        if (data) {
          setForm({
            ...GENERAL_FORM_DEFAULT,
            ...data,
          });
        }
      } catch (err) {
        // 404 or failed load -> Reset form to default values with school fields pre-filled
        const selectedSchoolObj = manualScope.schoolOptions?.find(
          (s) => String(s.id) === String(activeSchoolId)
        );
        const resolvedSchoolName = isSchoolAdmin
          ? authSchoolName
          : selectedSchoolObj?.schoolName || selectedSchoolObj?.name || "";

        setForm({
          ...GENERAL_FORM_DEFAULT,
          schoolId: activeSchoolId,
          headOfficeId: activeHeadOfficeId || null,
          schoolName: resolvedSchoolName,
          school: resolvedSchoolName,
        });
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [activeSchoolId, activeHeadOfficeId, isSchoolAdmin]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === "currency") {
      const match = CURRENCIES.find((c) => c.code === value);
      setForm((prev) => ({
        ...prev,
        currency: value,
        currencySymbol: match ? match.symbol : prev.currencySymbol,
      }));
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, brandLogo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, faviconIcon: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!activeSchoolId) {
      setError("Please select a School first.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const selectedSchoolObj = manualScope.schoolOptions?.find(
        (s) => String(s.id) === String(activeSchoolId)
      );
      const resolvedSchoolName = isSchoolAdmin
        ? authSchoolName
        : selectedSchoolObj?.schoolName || selectedSchoolObj?.name || "";

      const payload = {
        ...form,
        schoolId: activeSchoolId,
        headOfficeId: activeHeadOfficeId || null,
        schoolName: resolvedSchoolName,
        school: resolvedSchoolName,
      };

      const savedData = await saveGeneralSetting(payload);
      if (savedData) {
        setForm(savedData);
        setSuccess(true);
        window.dispatchEvent(new CustomEvent("sm:general-settings-refresh"));
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save general settings.");
    } finally {
      setSaving(false);
    }
  };

  const displaySchoolName = useMemo(() => {
    if (isSchoolAdmin) {
      return form.schoolName || authSchoolName || "My School";
    }
    const selectedSchoolObj = manualScope.schoolOptions?.find(
      (s) => String(s.id) === String(activeSchoolId)
    );
    return selectedSchoolObj?.schoolName || selectedSchoolObj?.name || form.schoolName || "";
  }, [isSchoolAdmin, form.schoolName, authSchoolName, activeSchoolId, manualScope.schoolOptions]);

  const selectedTheme = THEMES.find((t) => t.value === form.theme);

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">General Settings</h1>
          <span className="text-secondary-light">Administrator / General Settings</span>
        </div>
        {activeSchoolId && canEdit(PAGE_SLUG) && (
          <button
            type="button"
            className="btn btn-primary-600 d-flex align-items-center gap-6"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <i className="ri-save-line" /> Save Settings
              </>
            )}
          </button>
        )}
      </div>

      {/* Success notification */}
      {success && (
        <div
          className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8"
          role="alert"
        >
          <i className="ri-checkbox-circle-line text-lg" />
          General settings saved successfully!
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8"
          role="alert"
        >
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      )}

      {/* ── Dynamic Scope Selector Card (for Super Admins & Head Office Admins) ── */}
      {(isSuperAdmin || isHeadOfficeAdmin) && (
        <div className="card mb-20">
          <div className="card-header border-bottom border-neutral-200 px-20 py-16">
            <h6 className="fw-semibold text-primary-light mb-0">Select Configuration Scope</h6>
          </div>
          <div className="card-body p-20">
            <div className="row g-20">
              {isSuperAdmin && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-primary-light mb-8">Head Office</label>
                  <select
                    className="form-select form-control"
                    value={manualScope.selectedHeadOfficeId}
                    onChange={(e) => manualScope.setSelectedHeadOfficeId(e.target.value)}
                  >
                    <option value="">Select Head Office</option>
                    {manualScope.headOffices.map((ho) => (
                      <option key={ho.id} value={ho.id}>
                        {ho.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className={isSuperAdmin ? "col-md-6" : "col-12"}>
                <label className="form-label fw-semibold text-primary-light mb-8">School Name *</label>
                <select
                  className="form-select form-control"
                  value={manualScope.selectedSchoolId}
                  onChange={(e) => manualScope.setSelectedSchoolId(e.target.value)}
                  required
                >
                  <option value="">Select School</option>
                  {manualScope.schoolOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.schoolName || s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-40 bg-white radius-8 border border-neutral-200">
          <div className="spinner-border text-primary-600 mb-12" role="status" />
          <span className="text-secondary-light">Loading settings data...</span>
        </div>
      ) : !activeSchoolId ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-40 bg-white radius-8 border border-neutral-200">
          <i className="ri-information-line text-secondary-light mb-8" style={{ fontSize: "2.5rem" }} />
          <span className="text-secondary-light">Please select a school scope to configure general settings.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="row g-20">

            {/* ── LEFT COLUMN ── */}
            <div className="col-lg-8">

              {/* Brand Information */}
              <div className="card mb-20">
                <div className="card-header border-bottom border-neutral-200 px-20 py-16">
                  <div className="d-flex align-items-center gap-10">
                    <span
                      className="d-flex align-items-center justify-content-center radius-8"
                      style={{ width: 36, height: 36, background: "#eef2ff" }}
                    >
                      <i className="ri-building-line text-primary-600" />
                    </span>
                    <h6 className="fw-semibold text-primary-light mb-0">Brand Information</h6>
                  </div>
                </div>
                <div className="card-body p-20">
                  <div className="row g-10">
                    <Field label="School Name" icon="ri-school-line">
                      <input
                        type="text"
                        className="form-control"
                        value={displaySchoolName}
                        readOnly
                        disabled
                        style={{ ...iStyle, backgroundColor: "#f3f4f6", color: "#4b5563" }}
                      />
                    </Field>

                    <Field label="Brand Name" required icon="ri-bookmark-line">
                      <input
                        type="text"
                        id="brandName"
                        className={inputCls}
                        placeholder="e.g. School Man Pro"
                        value={form.brandName || ""}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      />
                    </Field>

                    <Field label="Brand Title" required icon="ri-text-wrap">
                      <input
                        type="text"
                        id="brandTitle"
                        className={inputCls}
                        placeholder="e.g. Infitoolz Schools Manager Pro"
                        value={form.brandTitle || ""}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      />
                    </Field>

                    <Field label="Brand Footer"  icon="ri-copyright-line">
                      <input
                        type="text"
                        id="brandFooter"
                        className={inputCls}
                        placeholder="Copyright © Your Brand"
                        value={form.brandFooter || ""}
                        onChange={handleChange}
                        style={iStyle}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Locale & Display */}
              <div className="card mb-20">
                <div className="card-header border-bottom border-neutral-200 px-20 py-16">
                  <div className="d-flex align-items-center gap-10">
                    <span
                      className="d-flex align-items-center justify-content-center radius-8"
                      style={{ width: 36, height: 36, background: "#f0fdf4" }}
                    >
                      <i className="ri-global-line" style={{ color: "#16a34a" }} />
                    </span>
                    <h6 className="fw-semibold text-primary-light mb-0">Locale &amp; Display</h6>
                  </div>
                </div>
                <div className="card-body p-20">
                  <div className="row g-10">
                    <Field label="Global Language" required icon="ri-translate-2">
                      <select
                        id="language"
                        className={selectCls}
                        value={form.language || "English"}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Default Time Zone" required icon="ri-time-zone-line">
                      <select
                        id="timeZone"
                        className={selectCls}
                        value={form.timeZone || "(GMT+06:00) Dhaka"}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Currency" icon="ri-money-dollar-circle-line">
                      <select
                        id="currency"
                        className={selectCls}
                        value={form.currency || "INR"}
                        onChange={handleChange}
                        style={iStyle}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Currency Symbol" icon="ri-currency-line">
                      <input
                        type="text"
                        id="currencySymbol"
                        className={inputCls}
                        placeholder="e.g. ₹"
                        value={form.currencySymbol || ""}
                        onChange={handleChange}
                        style={iStyle}
                      />
                    </Field>

                    <Field label="Date Format" required icon="ri-calendar-line">
                      <select
                        id="dateFormat"
                        className={selectCls}
                        value={form.dateFormat || "MMM DD, YYYY"}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      >
                        {DATE_FORMATS.map((df) => (
                          <option key={df.value} value={df.value}>{df.label}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Enable RTL" required icon="ri-align-right">
                      <select
                        id="enableRtl"
                        className={selectCls}
                        value={form.enableRtl || "No"}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Theme & Frontend */}
              <div className="card mb-20">
                <div className="card-header border-bottom border-neutral-200 px-20 py-16">
                  <div className="d-flex align-items-center gap-10">
                    <span
                      className="d-flex align-items-center justify-content-center radius-8"
                      style={{ width: 36, height: 36, background: "#fdf4ff" }}
                    >
                      <i className="ri-palette-line" style={{ color: "#9333ea" }} />
                    </span>
                    <h6 className="fw-semibold text-primary-light mb-0">Theme &amp; Frontend</h6>
                  </div>
                </div>
                <div className="card-body p-20">
                  <div className="row g-10">
                    <Field label="Enable Frontend" required icon="ri-layout-line">
                      <select
                        id="enableFrontend"
                        className={selectCls}
                        value={form.enableFrontend || "Yes"}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </Field>

                    <Field label="Theme" required icon="ri-brush-line">
                      <select
                        id="theme"
                        className={selectCls}
                        value={form.theme || "navy-blue"}
                        onChange={handleChange}
                        style={iStyle}
                        required
                      >
                        {THEMES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </Field>

                    {/* Theme swatches */}
                    <div className="col-12 mb-4">
                      <label className="form-label fw-semibold text-primary-light mb-10 d-block">
                        Theme Preview
                      </label>
                      <div className="d-flex flex-wrap gap-10">
                        {THEMES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, theme: t.value }))}
                            title={t.label}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: t.color,
                              border: form.theme === t.value
                                ? `3px solid ${t.color}`
                                : "3px solid transparent",
                              outline: form.theme === t.value
                                ? `2px solid #fff`
                                : "2px solid transparent",
                              boxShadow: form.theme === t.value
                                ? `0 0 0 3px ${t.color}55`
                                : "none",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          />
                        ))}
                      </div>
                      {selectedTheme && (
                        <p className="text-xs text-secondary-light mt-8">
                          Selected:{" "}
                          <span
                            className="fw-semibold"
                            style={{ color: selectedTheme.color }}
                          >
                            {selectedTheme.label}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Analytics */}
              <div className="card mb-20">
                <div className="card-header border-bottom border-neutral-200 px-20 py-16">
                  <div className="d-flex align-items-center gap-10">
                    <span
                      className="d-flex align-items-center justify-content-center radius-8"
                      style={{ width: 36, height: 36, background: "#fff7ed" }}
                    >
                      <i className="ri-bar-chart-2-line" style={{ color: "#ea580c" }} />
                    </span>
                    <h6 className="fw-semibold text-primary-light mb-0">Google Analytics</h6>
                  </div>
                </div>
                <div className="card-body p-20">
                  <div className="row g-0">
                    <Field label="Google Analytics Tracking ID" full icon="ri-line-chart-line">
                      <input
                        type="text"
                        id="googleAnalytics"
                        className={inputCls}
                        placeholder="e.g. G-XXXXXXXXXX or UA-XXXXXXXX-X"
                        value={form.googleAnalytics || ""}
                        onChange={handleChange}
                        style={iStyle}
                      />
                    </Field>
                    <div className="col-12">
                      <div
                        className="d-flex align-items-start gap-10 radius-8 p-12"
                        style={{
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                          color: "#9a3412",
                        }}
                      >
                        <i className="ri-information-line mt-2" style={{ flexShrink: 0 }} />
                        <span className="text-sm">
                          Enter your Google Analytics 4 measurement ID (starts with{" "}
                          <strong>G-</strong>) or Universal Analytics tracking ID (starts with{" "}
                          <strong>UA-</strong>). Leave blank to disable analytics.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="col-lg-4">

              {/* Brand Logo & Favicon upload widgets */}
              <div className="card mb-20">
                <div className="card-header border-bottom border-neutral-200 px-20 py-16">
                  <div className="d-flex align-items-center gap-10">
                    <span
                      className="d-flex align-items-center justify-content-center radius-8"
                      style={{ width: 36, height: 36, background: "#eef2ff" }}
                    >
                      <i className="ri-image-line text-primary-600" />
                    </span>
                    <h6 className="fw-semibold text-primary-light mb-0">Brand Assets</h6>
                  </div>
                </div>
                <div className="card-body p-20">
                  
                  {/* Logo Upload */}
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
                      Brand Logo
                    </label>
                    <div
                      className="border border-neutral-300 radius-8 p-16 d-flex flex-column align-items-center justify-content-center cursor-pointer position-relative"
                      style={{ minHeight: 110, background: "#f9fafb", transition: "border-color .2s" }}
                    >
                      {form.brandLogo ? (
                        <div className="position-relative text-center">
                          <img
                            src={form.brandLogo}
                            alt="preview"
                            style={{ maxWidth: 100, maxHeight: 110, objectFit: "contain", borderRadius: 4 }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger text-xs p-4 py-2 position-absolute"
                            style={{ top: -8, right: -8, borderRadius: "50%" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm((prev) => ({ ...prev, brandLogo: "" }));
                            }}
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-100 h-100 text-center m-0 cursor-pointer d-flex flex-column align-items-center justify-content-center">
                          <i className="ri-image-add-line text-secondary-light mb-6" style={{ fontSize: "1.8rem" }} />
                          <span className="text-xs text-secondary-light">Click to upload Logo</span>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.svg,.webp"
                            style={{ display: "none" }}
                            onChange={handleLogoUpload}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-secondary-light mt-6">Dimension: Max-W: 100px, Max-H: 110px</p>
                  </div>

                  {/* Favicon Upload */}
                  <div className="mb-20">
                    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
                      Favicon Icon
                    </label>
                    <div
                      className="border border-neutral-300 radius-8 p-16 d-flex flex-column align-items-center justify-content-center cursor-pointer position-relative"
                      style={{ minHeight: 110, background: "#f9fafb", transition: "border-color .2s" }}
                    >
                      {form.faviconIcon ? (
                        <div className="position-relative text-center">
                          <img
                            src={form.faviconIcon}
                            alt="preview"
                            style={{ maxWidth: 20, maxHeight: 20, objectFit: "contain", borderRadius: 4 }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger text-xs p-4 py-2 position-absolute"
                            style={{ top: -8, right: -8, borderRadius: "50%" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm((prev) => ({ ...prev, faviconIcon: "" }));
                            }}
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-100 h-100 text-center m-0 cursor-pointer d-flex flex-column align-items-center justify-content-center">
                          <i className="ri-image-add-line text-secondary-light mb-6" style={{ fontSize: "1.8rem" }} />
                          <span className="text-xs text-secondary-light">Click to upload Favicon</span>
                          <input
                            type="file"
                            accept=".ico,.png,.svg,.jpg,.jpeg"
                            style={{ display: "none" }}
                            onChange={handleFaviconUpload}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-secondary-light mt-6">Dimension: Max-W: 20px, Max-H: 20px</p>
                  </div>

                </div>
              </div>

              {/* Settings Summary Card */}
              <div className="card mb-20">
                <div className="card-header border-bottom border-neutral-200 px-20 py-16">
                  <h6 className="fw-semibold text-primary-light mb-0">
                    <i className="ri-eye-line me-6 text-secondary-light" />
                    Current Settings
                  </h6>
                </div>
                <div className="card-body p-20">
                  {[
                    { label: "Brand", value: form.brandName, icon: "ri-bookmark-fill" },
                    { label: "Language", value: form.language, icon: "ri-translate-2" },
                    { label: "Currency", value: `${form.currency || ""} (${form.currencySymbol || ""})`, icon: "ri-money-dollar-circle-fill" },
                    { label: "RTL", value: form.enableRtl, icon: "ri-align-right" },
                    { label: "Frontend", value: form.enableFrontend, icon: "ri-layout-fill" },
                    { label: "Theme", value: selectedTheme?.label, icon: "ri-palette-fill" },
                    { label: "Timezone", value: form.timeZone?.replace(/\(.*?\)\s*/, ""), icon: "ri-time-zone-fill" },
                    { label: "Date Format", value: DATE_FORMATS.find(d => d.value === form.dateFormat)?.label, icon: "ri-calendar-fill" },
                  ].map(({ label, value, icon }) => (
                    <div
                      key={label}
                      className="d-flex align-items-center justify-content-between py-8 border-bottom border-neutral-100"
                      style={{ gap: 8 }}
                    >
                      <span className="d-flex align-items-center gap-6 text-sm text-secondary-light">
                        <i className={icon} />
                        {label}
                      </span>
                      <span
                        className="text-sm fw-medium text-primary-light text-end"
                        style={{ maxWidth: "55%", wordBreak: "break-word" }}
                      >
                        {value || <span className="text-secondary-light">—</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save button */}
              {canEdit(PAGE_SLUG) && (
                <button
                  type="submit"
                  className="btn btn-primary-600 w-100 d-flex align-items-center justify-content-center gap-8"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line" /> Save Settings
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default GeneralSetting;
