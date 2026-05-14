import React, { useState, useRef } from "react";
import "../assets/css/addModalShared.css";

/* ─── helpers ─── */
const TABS = ["Basic Information", "Social Links", "Other Information"];

const emptyForm = {
  // Basic Info
  phone: "",
  email: "",
  address: "",
  googleMapUrl: "",
  openingDay: "",
  openingHour: "",
  demoVideoType: "Youtube",
  videoId: "",
  footerNote: "",
  aboutBrand: "",
  // Social
  facebookUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  instagramUrl: "",
  pinterestUrl: "",
  // Images
  aboutImage: null,
  headerLogo: null,
  footerLogo: null,
};

const ImageUploadField = ({ label, id, value, onChange }) => {
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
    <div className="col-md-4 mb-20">
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">
        {label}
      </label>
      <div
        className="border border-neutral-300 radius-8 p-16 text-center cursor-pointer"
        style={{ minHeight: 120, background: "#f9fafb" }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ maxHeight: 80, maxWidth: "100%", borderRadius: 6 }}
          />
        ) : (
          <>
            <i className="ri-image-add-line text-3xl text-secondary-light d-block mb-8" />
            <span className="text-xs text-secondary-light">
              Click to upload
            </span>
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
      <p className="text-xs text-secondary-light mt-6">
        Supported: jpg, jpeg, png, gif, svg, webp
      </p>
    </div>
  );
};

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

const inputStyle = (hasIcon = true) => ({
  paddingLeft: hasIcon ? "2.5rem" : "0.875rem",
});

const SubscriptionSetting = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (id, file) => {
    setForm((prev) => ({ ...prev, [id]: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Subscription Settings
          </h1>
          <span className="text-secondary-light">
            Subscription / Settings
          </span>
        </div>
      </div>

      {/* Success toast */}
      {saved && (
        <div
          className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8"
          role="alert"
        >
          <i className="ri-checkbox-circle-line text-lg" />
          Settings saved successfully!
        </div>
      )}

      <div className="card h-100">
        {/* Tab navigation */}
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === i
                    ? "2px solid var(--primary-600, #4f46e5)"
                    : "2px solid transparent",
                color:
                  activeTab === i
                    ? "var(--primary-600, #4f46e5)"
                    : "var(--secondary-light, #667085)",
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
          <form onSubmit={handleSubmit}>
            {/* ═══ TAB 0 – Basic Information ═══ */}
            {activeTab === 0 && (
              <div className="row g-0">
                <Field label="Phone" icon="ri-phone-line">
                  <input
                    type="tel"
                    id="phone"
                    className="form-control"
                    placeholder="e.g. 0123456789"
                    value={form.phone}
                    onChange={handleChange}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="Email" required icon="ri-mail-line">
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    placeholder="info@example.com"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="Address" required full icon="ri-map-pin-line">
                  <input
                    type="text"
                    id="address"
                    className="form-control"
                    placeholder="329 Queensberry Street, Melbourne VIC 3051, AU"
                    value={form.address}
                    onChange={handleChange}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="Google Map URL" required full icon="ri-map-2-line">
                  <input
                    type="url"
                    id="googleMapUrl"
                    className="form-control"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    value={form.googleMapUrl}
                    onChange={handleChange}
                    style={inputStyle()}
                  />
                </Field>

                {/* Map Preview */}
                {form.googleMapUrl && (
                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
                      Map Preview
                    </label>
                    <div className="radius-8 overflow-hidden border border-neutral-200">
                      <iframe
                        src={form.googleMapUrl}
                        width="100%"
                        height="240"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Map"
                      />
                    </div>
                  </div>
                )}

                <Field label="Opening Day" required icon="ri-calendar-line">
                  <input
                    type="text"
                    id="openingDay"
                    className="form-control"
                    placeholder="e.g. Saturday – Friday"
                    value={form.openingDay}
                    onChange={handleChange}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="Opening Hour" required icon="ri-time-line">
                  <input
                    type="text"
                    id="openingHour"
                    className="form-control"
                    placeholder="e.g. 8:00 AM – 10:00 PM"
                    value={form.openingHour}
                    onChange={handleChange}
                    style={inputStyle()}
                  />
                </Field>

                <Field label="Demo Video" required icon="ri-video-line">
                  <select
                    id="demoVideoType"
                    className="form-control form-select"
                    value={form.demoVideoType}
                    onChange={handleChange}
                    style={inputStyle()}
                  >
                    <option value="Youtube">Youtube</option>
                    <option value="Vimeo">Vimeo</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Video ID" required icon="ri-film-line">
                  <input
                    type="text"
                    id="videoId"
                    className="form-control"
                    placeholder="e.g. zER53gdu74w"
                    value={form.videoId}
                    onChange={handleChange}
                    style={inputStyle()}
                  />
                </Field>

                {/* Video Preview */}
                {form.demoVideoType === "Youtube" && form.videoId && (
                  <div className="col-12 mb-20">
                    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
                      Video Preview
                    </label>
                    <div className="radius-8 overflow-hidden border border-neutral-200">
                      <iframe
                        width="100%"
                        height="240"
                        src={`https://www.youtube.com/embed/${form.videoId}`}
                        title="YouTube video preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                <Field label="Footer Note" required full icon="ri-sticky-note-line">
                  <textarea
                    id="footerNote"
                    rows={3}
                    className="form-control"
                    placeholder="Enter footer note..."
                    value={form.footerNote}
                    onChange={handleChange}
                    style={{ paddingLeft: "2.5rem", paddingTop: "0.65rem" }}
                  />
                </Field>

                <Field label="About Brand" required full icon="ri-information-line">
                  <textarea
                    id="aboutBrand"
                    rows={6}
                    className="form-control"
                    placeholder="Enter brand description..."
                    value={form.aboutBrand}
                    onChange={handleChange}
                    style={{ paddingLeft: "2.5rem", paddingTop: "0.65rem" }}
                  />
                </Field>
              </div>
            )}

            {/* ═══ TAB 1 – Social Links ═══ */}
            {activeTab === 1 && (
              <div className="row g-0">
                {[
                  {
                    id: "facebookUrl",
                    label: "Facebook URL",
                    icon: "ri-facebook-circle-line",
                    placeholder: "https://www.facebook.com/",
                    color: "#1877f2",
                  },
                  {
                    id: "twitterUrl",
                    label: "Twitter URL",
                    icon: "ri-twitter-x-line",
                    placeholder: "https://twitter.com/",
                    color: "#000",
                  },
                  {
                    id: "linkedinUrl",
                    label: "LinkedIn URL",
                    icon: "ri-linkedin-box-line",
                    placeholder: "https://www.linkedin.com/",
                    color: "#0a66c2",
                  },
                  {
                    id: "youtubeUrl",
                    label: "Youtube URL",
                    icon: "ri-youtube-line",
                    placeholder: "https://www.youtube.com/",
                    color: "#ff0000",
                  },
                  {
                    id: "instagramUrl",
                    label: "Instagram URL",
                    icon: "ri-instagram-line",
                    placeholder: "https://www.instagram.com/",
                    color: "#e1306c",
                  },
                  {
                    id: "pinterestUrl",
                    label: "Pinterest URL",
                    icon: "ri-pinterest-line",
                    placeholder: "https://www.pinterest.com/",
                    color: "#e60023",
                  },
                ].map(({ id, label, icon, placeholder, color }) => (
                  <div key={id} className="col-md-6 mb-20">
                    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "0.85rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color,
                          zIndex: 1,
                          fontSize: "1.1rem",
                          pointerEvents: "none",
                        }}
                      >
                        <i className={icon} />
                      </span>
                      <input
                        type="url"
                        id={id}
                        className="form-control"
                        placeholder={placeholder}
                        value={form[id]}
                        onChange={handleChange}
                        style={{ paddingLeft: "2.5rem" }}
                      />
                    </div>
                  </div>
                ))}

                {/* Social preview badges */}
                <div className="col-12 mt-8">
                  <p className="text-sm fw-semibold text-primary-light mb-12">
                    Connected Platforms
                  </p>
                  <div className="d-flex flex-wrap gap-10">
                    {[
                      { id: "facebookUrl", icon: "ri-facebook-circle-fill", color: "#1877f2", label: "Facebook" },
                      { id: "twitterUrl", icon: "ri-twitter-x-fill", color: "#000", label: "X / Twitter" },
                      { id: "linkedinUrl", icon: "ri-linkedin-box-fill", color: "#0a66c2", label: "LinkedIn" },
                      { id: "youtubeUrl", icon: "ri-youtube-fill", color: "#ff0000", label: "YouTube" },
                      { id: "instagramUrl", icon: "ri-instagram-fill", color: "#e1306c", label: "Instagram" },
                      { id: "pinterestUrl", icon: "ri-pinterest-fill", color: "#e60023", label: "Pinterest" },
                    ].map(({ id, icon, color, label }) =>
                      form[id] ? (
                        <a
                          key={id}
                          href={form[id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-flex align-items-center gap-6 px-12 py-6 radius-8 border"
                          style={{
                            color,
                            borderColor: color + "44",
                            background: color + "0d",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                          }}
                        >
                          <i className={icon} style={{ fontSize: "1rem" }} />
                          {label}
                        </a>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 2 – Other Information ═══ */}
            {activeTab === 2 && (
              <div className="row g-0">
                <div className="col-12 mb-20">
                  <p className="text-sm text-secondary-light mb-16">
                    Upload the images used in your subscription portal. Supported formats: jpg, jpeg, png, gif, svg, webp.
                  </p>
                </div>

                {[
                  { id: "aboutImage", label: "About Image" },
                  { id: "headerLogo", label: "Header Logo" },
                  { id: "footerLogo", label: "Footer Logo" },
                ].map(({ id, label }) => (
                  <ImageUploadField
                    key={id}
                    id={id}
                    label={label}
                    value={form[id]}
                    onChange={handleImageChange}
                  />
                ))}

                <div className="col-12 mt-8">
                  <div className="alert d-flex align-items-start gap-10 radius-8" style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1" }}>
                    <i className="ri-information-line mt-2" style={{ flexShrink: 0 }} />
                    <div className="text-sm">
                      <strong>Tip:</strong> For best results, use transparent PNG files for logos.
                      The About Image should be at least <strong>1200×600px</strong> for optimal display.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Navigation & Save ─── */}
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
                    type="button"
                    className="btn btn-primary-600 px-20"
                    onClick={() => setActiveTab((t) => Math.min(TABS.length - 1, t + 1))}
                  >
                    Next <i className="ri-arrow-right-line ms-6" />
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary-600 px-24">
                    <i className="ri-save-line me-6" /> Save Settings
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

export default SubscriptionSetting;
