import React, { useEffect, useMemo, useState } from "react";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { useSchool } from "../context/useSchool";
import { useAuth } from "../context/useAuth";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { createFrontendPage, updateFrontendPage } from "../apis/frontendPagesApi";
import { findSchoolById } from "../utils/schoolScope";
import { normalizeRole } from "../utils/roles";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "frontend-page-edit-row";

const emptyForm = {
  schoolId: "",
  location: "",
  title: "",
  urlSlug: "",
  description: "",
  image: "",
};

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Location: "ri-map-pin-line",
  Title: "ri-text",
  "Url Slug": "ri-link",
  Description: "ri-article-line",
};

const FormField = ({ label, required, children, full = false, helpText = "" }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#667085", zIndex: 1 }}>
          <i className={icon}></i>
        </span>
        {children}
      </div>
      {helpText && <p className="text-xs text-secondary-light mt-4">{helpText}</p>}
    </div>
  );
};

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const FrontendPageCreate = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId, headOfficeName: authHeadOfficeName } = useAuth();
  const { activeSchoolId } = useSchool();
  const normalizedRole = normalizeRole(role);
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
  const isHeadOfficeAdmin = normalizedRole === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = normalizedRole === "SCHOOL_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

  const [initialEditRow] = useState(() => readEditRow());

  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        ...initialEditRow,
        schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : "",
      };
    }
    const listSchoolId = isSuperAdmin ? "" : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : "";
    return { ...emptyForm, schoolId: listSchoolId };
  });

  const [editingId] = useState(() => {
    return initialEditRow?.id ?? null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(() => {
    return initialEditRow?.image || "";
  });

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup();
        setSchools(Array.isArray(list) ? list : []);
      } catch {
        setSchools([]);
      }
    };
    void loadSchools();
  }, []);

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return;
    const school = findSchoolById(schools, initialEditRow.schoolId);
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ""));
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope]);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    const filtered = Array.isArray(schools)
      ? schools.filter((school) => {
          if (isHeadOfficeAdmin && authHeadOfficeId != null) {
            return String(school?.headOfficeId ?? "") === String(authHeadOfficeId);
          }
          return true;
        })
      : [];
    const fallbackSchoolId = form.schoolId || authSchoolId || "";
    const fallback = fallbackSchoolId && !filtered.some((school) => String(school.id) === String(fallbackSchoolId)) && authSchoolName
      ? [{ id: fallbackSchoolId, schoolName: authSchoolName }]
      : [];
    return [...filtered, ...fallback];
  }, [isSuperAdmin, manualScope.schoolOptions, schools, isHeadOfficeAdmin, authHeadOfficeId, form.schoolId, authSchoolId, authSchoolName]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [id]: value };
      if (id === "title" && !prev.urlSlug) {
        next.urlSlug = slugify(value);
      }
      return next;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        setForm((prev) => ({ ...prev, image: dataUrl }));
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    const schoolId = isSuperAdmin ? manualScope.selectedSchoolId : form.schoolId;

    if (!schoolId) {
      setError("School is required");
      return;
    }
    if (!form.location) {
      setError("Location is required");
      return;
    }
    if (!form.title) {
      setError("Title is required");
      return;
    }
    if (!form.urlSlug) {
      setError("URL Slug is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        schoolId: Number(schoolId),
        location: String(form.location || "").trim(),
        title: String(form.title || "").trim(),
        urlSlug: slugify(form.urlSlug),
        description: String(form.description || "").trim(),
        image: form.image || "",
      };

      if (editingId) {
        await updateFrontendPage(editingId, payload);
      } else {
        await createFrontendPage(payload);
      }

      setSuccess(true);
      setTimeout(() => onNavigate("frontend-page"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to save frontend page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">
          {editingId ? "Edit Frontend Page" : "Add New Frontend Page"}
        </h1>
        <button 
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" 
          onClick={() => onNavigate?.("frontend-page")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-24" role="alert">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="alert alert-success d-flex align-items-center gap-8 mb-24" role="alert">
          <i className="ri-checkbox-circle-line"></i>
          <span>Page {editingId ? "updated" : "saved"} successfully! Redirecting...</span>
        </div>
      ) : null}

      <div className="card">
        <div className="card-body">
          <form className="avm-grid" onSubmit={handleSubmit}>
            {isSuperAdmin ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <ManualScopeSelectors
                  enabled={isSuperAdmin}
                  headOffices={manualScope.headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                  onHeadOfficeChange={(value) => {
                    manualScope.setSelectedHeadOfficeId(value);
                    manualScope.setSelectedSchoolId("");
                    setForm((prev) => ({ ...prev, schoolId: "" }));
                  }}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(value) => {
                    manualScope.setSelectedSchoolId(value);
                    setForm((prev) => ({ ...prev, schoolId: value }));
                  }}
                  compact
                />
              </div>
            ) : (
              <>
                {isHeadOfficeAdmin ? (
                  <FormField label="Head Office" required>
                    <input className="avm-input" value={authHeadOfficeName || ""} readOnly />
                  </FormField>
                ) : null}
                <FormField label="School Name" required>
                  <select
                    id="schoolId"
                    className="avm-select form-select form-control"
                    value={form.schoolId}
                    onChange={handleChange}
                    disabled={!isSuperAdmin && !!activeSchoolId}
                    style={{ paddingLeft: "2.5rem" }}
                  >
                    <option value="">--Select School--</option>
                    {schoolOptions.map((school) => (
                      <option key={String(school.id)} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            )}

            <FormField label="Location" required>
              <select 
                id="location"
                className="avm-select form-select form-control"
                value={form.location}
                onChange={handleChange}
                style={{ paddingLeft: "2.5rem" }}
              >
                <option value="">--Select--</option>
                <option value="Footer">Footer</option>
                <option value="Main Menu">Main Menu</option>
              </select>
            </FormField>

            <FormField label="Title" required>
              <input 
                type="text" 
                id="title"
                className="avm-input form-control" 
                placeholder="Enter Page Title" 
                value={form.title}
                onChange={handleChange}
                style={{ paddingLeft: "2.5rem" }}
              />
            </FormField>

            <FormField 
              label="Url Slug" 
              required 
              full 
              helpText="Ex: terms-and-condition. [ Must be english alphanumeric/hyphens ]"
            >
              <input 
                type="text" 
                id="urlSlug"
                className="avm-input form-control" 
                placeholder="url-slug-example" 
                value={form.urlSlug}
                onChange={handleChange}
                style={{ paddingLeft: "2.5rem" }}
              />
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Description</label>
              <textarea 
                id="description"
                rows={6} 
                className="form-control" 
                placeholder="Page content description..." 
                style={{ borderRadius: "8px", paddingLeft: "1rem" }} 
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="avm-field full">
              <label className="avm-label">Image</label>
              <div className="upload-container border border-neutral-300 radius-8 p-20 text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mb-12 radius-8" style={{ maxHeight: "150px" }} />
                ) : (
                  <div className="mb-12"><i className="ri-image-add-line text-40 text-secondary-light"></i></div>
                )}
                <input 
                  type="file" 
                  className="form-control" 
                  accept=".jpg,.jpeg,.png,.gif" 
                  onChange={handleImageChange} 
                />
                <p className="text-xs text-secondary-light mt-8">
                  Dimension:- Max-W: 600px, Max-H: 600px | .jpg, .jpeg, .png or .gif
                </p>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button 
                type="button" 
                className="btn btn-outline-neutral px-24 py-12 radius-8" 
                onClick={() => onNavigate?.("frontend-page")}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary-600 px-24 py-12 radius-8"
                disabled={loading}
              >
                {loading ? "Saving..." : editingId ? "Update Page" : "Save Page"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FrontendPageCreate;