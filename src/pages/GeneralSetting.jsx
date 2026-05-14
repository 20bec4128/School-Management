import React, { useState, useRef } from "react";
import "../assets/css/addModalShared.css";

/* ─── Static options ─── */
const LANGUAGES = [
  "English", "Arabic", "Bengali", "Chinese", "French", "German",
  "Hindi", "Indonesian", "Italian", "Japanese", "Korean", "Malay",
  "Persian", "Portuguese", "Russian", "Spanish", "Turkish", "Urdu",
];

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD – US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR – Euro" },
  { code: "GBP", symbol: "£", label: "GBP – British Pound" },
  { code: "INR", symbol: "₹", label: "INR – Indian Rupee" },
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
  "(GMT+06:00) Dhaka",
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

/* ─── Reusable components ─── */
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

/* ─── Image upload widget ─── */
const LogoUpload = ({ label, hint, maxW, maxH, accept = ".jpg,.jpeg,.png,.gif,.svg,.webp" }) => {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="col-md-6 mb-20">
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">
        {label}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="border border-neutral-300 radius-8 p-16 d-flex flex-column align-items-center justify-content-center cursor-pointer"
        style={{ minHeight: 130, background: "#f9fafb", transition: "border-color .2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{
              maxWidth: maxW || 100,
              maxHeight: maxH || 110,
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
        ) : (
          <>
            <i
              className="ri-image-add-line text-secondary-light mb-6"
              style={{ fontSize: "2rem" }}
            />
            <span className="text-xs text-secondary-light">Click to upload</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={handleFile} />
      {hint && <p className="text-xs text-secondary-light mt-6">{hint}</p>}
    </div>
  );
};

/* ─── Section divider ─── */
const SectionTitle = ({ icon, title }) => (
  <div className="col-12 mb-16 mt-8">
    <div className="d-flex align-items-center gap-8">
      <span
        className="d-flex align-items-center justify-content-center radius-8"
        style={{ width: 32, height: 32, background: "#eef2ff" }}
      >
        <i className={`${icon} text-primary-600`} />
      </span>
      <h6 className="fw-semibold text-primary-light mb-0" style={{ fontSize: "0.9rem" }}>
        {title}
      </h6>
      <div className="flex-1 border-bottom border-neutral-200 ms-4" style={{ flex: 1 }} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   Main Component
═══════════════════════════════════════════ */
const GeneralSetting = () => {
  const [form, setForm] = useState({
    brandName: "School Man Pro",
    brandTitle: "Infitoolz Schools Manager Pro",
    language: "English",
    currency: "INR",
    currencySymbol: "₹",
    enableRTL: "No",
    enableFrontend: "Yes",
    theme: "navy-blue",
    timeZone: "(GMT+06:00) Dhaka",
    dateFormat: "MMM DD, YYYY",
    brandFooter: "Copyright © Infitoolz Schools Manager Pro",
    googleAnalytics: "",
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    // Auto-fill currency symbol when currency changes
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const selectedTheme = THEMES.find((t) => t.value === form.theme);

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">General Settings</h1>
          <span className="text-secondary-light">Subscription / General Settings</span>
        </div>
        <button
          type="button"
          className="btn btn-primary-600 d-flex align-items-center gap-6"
          onClick={handleSubmit}
        >
          <i className="ri-save-line" /> Save Settings
        </button>
      </div>

      {/* Success toast */}
      {saved && (
        <div
          className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8"
          role="alert"
        >
          <i className="ri-checkbox-circle-line text-lg" />
          General settings saved successfully!
        </div>
      )}

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
                <div className="row g-0">
                  <Field label="Brand Name" required icon="ri-bookmark-line">
                    <input
                      type="text"
                      id="brandName"
                      className={inputCls}
                      placeholder="e.g. School Man Pro"
                      value={form.brandName}
                      onChange={handleChange}
                      style={iStyle}
                    />
                  </Field>

                  <Field label="Brand Title" required icon="ri-text-wrap">
                    <input
                      type="text"
                      id="brandTitle"
                      className={inputCls}
                      placeholder="e.g. Infitoolz Schools Manager Pro"
                      value={form.brandTitle}
                      onChange={handleChange}
                      style={iStyle}
                    />
                  </Field>

                  <Field label="Brand Footer" full icon="ri-copyright-line">
                    <input
                      type="text"
                      id="brandFooter"
                      className={inputCls}
                      placeholder="Copyright © Your Brand"
                      value={form.brandFooter}
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
                <div className="row g-0">
                  <Field label="Global Language" required icon="ri-translate-2">
                    <select
                      id="language"
                      className={selectCls}
                      value={form.language}
                      onChange={handleChange}
                      style={iStyle}
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
                      value={form.timeZone}
                      onChange={handleChange}
                      style={iStyle}
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
                      value={form.currency}
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
                      value={form.currencySymbol}
                      onChange={handleChange}
                      style={iStyle}
                    />
                  </Field>

                  <Field label="Date Format" required icon="ri-calendar-line">
                    <select
                      id="dateFormat"
                      className={selectCls}
                      value={form.dateFormat}
                      onChange={handleChange}
                      style={iStyle}
                    >
                      {DATE_FORMATS.map((df) => (
                        <option key={df.value} value={df.value}>{df.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Enable RTL" required icon="ri-align-right">
                    <select
                      id="enableRTL"
                      className={selectCls}
                      value={form.enableRTL}
                      onChange={handleChange}
                      style={iStyle}
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
                <div className="row g-0">
                  <Field label="Enable Frontend" required icon="ri-layout-line">
                    <select
                      id="enableFrontend"
                      className={selectCls}
                      value={form.enableFrontend}
                      onChange={handleChange}
                      style={iStyle}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </Field>

                  <Field label="Theme" required icon="ri-brush-line">
                    <select
                      id="theme"
                      className={selectCls}
                      value={form.theme}
                      onChange={handleChange}
                      style={iStyle}
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
                      value={form.googleAnalytics}
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

            {/* Brand Logo */}
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
                <BrandLogoUpload
                  label="Brand Logo"
                  hint="Dimension: Max-W: 100px, Max-H: 110px"
                  maxW={100}
                  maxH={110}
                />
                <BrandLogoUpload
                  label="Favicon Icon"
                  hint="Dimension: Max-W: 20px, Max-H: 20px"
                  maxW={20}
                  maxH={20}
                  accept=".ico,.png,.svg"
                />
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
                  { label: "Currency", value: `${form.currency} (${form.currencySymbol})`, icon: "ri-money-dollar-circle-fill" },
                  { label: "RTL", value: form.enableRTL, icon: "ri-align-right" },
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

            {/* Save button (mobile / sidebar) */}
            <button type="submit" className="btn btn-primary-600 w-100 d-flex align-items-center justify-content-center gap-8">
              <i className="ri-save-line" /> Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/* ─── standalone logo uploader (no col wrapper — inside card) ─── */
const BrandLogoUpload = ({ label, hint, maxW, maxH, accept = ".jpg,.jpeg,.png,.gif,.svg,.webp" }) => {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="mb-20">
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        className="border border-neutral-300 radius-8 p-16 d-flex flex-column align-items-center justify-content-center cursor-pointer"
        style={{ minHeight: 110, background: "#f9fafb", transition: "border-color .2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: maxW, maxHeight: maxH, objectFit: "contain", borderRadius: 4 }}
          />
        ) : (
          <>
            <i className="ri-image-add-line text-secondary-light mb-6" style={{ fontSize: "1.8rem" }} />
            <span className="text-xs text-secondary-light">Click to upload</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={handleFile} />
      {hint && <p className="text-xs text-secondary-light mt-6">{hint}</p>}
    </div>
  );
};

export default GeneralSetting;
