import { useEffect, useMemo, useState } from "react";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { useSchool } from "../context/useSchool";
import { useAuth } from "../context/useAuth";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { createAboutSchool, updateAboutSchool } from "../apis/aboutSchoolsApi";
import { findSchoolById } from "../utils/schoolScope";
import { normalizeRole } from "../utils/roles";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "edit-about-school-row";

const emptyForm = {
  schoolId: "",
  schoolName: "",
  aboutText: "",
  image: "",
};

const FormField = ({ label, required, children, full = false, helpText = "" }) => (
  <div className={full ? "col-12 mb-20" : "col-md-6 mb-20"}>
    <label className="form-label fw-semibold text-primary-light mb-8 d-block">
      {label} {required && <span className="text-danger-600">*</span>}
    </label>
    <div className="avm-input-with-icon" style={{ position: "relative" }}>
      {children}
    </div>
    {helpText ? <p className="text-xs text-secondary-light mt-4">{helpText}</p> : null}
  </div>
);

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const createPlaceholderImage = (width, height) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" rx="8" ry="8" fill="#e5e7eb"/>
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="7" ry="7" fill="none" stroke="#cbd5e1"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="${Math.max(10, Math.floor(Math.min(width, height) / 7))}">No Image</text>
    </svg>`,
  )}`;

const resolveImageSrc = (value) => {
  const src = String(value || "").trim();
  if (!src) return createPlaceholderImage(160, 96);
  if (src.startsWith("data:") || src.startsWith("http")) return src;
  return src;
};

const AboutSchoolEdit = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId } = useAuth();
  const { activeSchoolId } = useSchool();
  const normalizedRole = normalizeRole(role);
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
  const isHeadOfficeAdmin = normalizedRole === "HEAD_OFFICE_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);
  const isSchoolAdmin = normalizedRole === "SCHOOL_ADMIN";
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null;
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    };
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isSchoolAdmin]);
  const [schools, setSchools] = useState([]);
  const [initialEditRow] = useState(() => readEditRow());
  const [editingId] = useState(() => initialEditRow?.aboutId ?? initialEditRow?.id ?? null);
  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        schoolId: initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : "",
        schoolName: initialEditRow.schoolName || "",
        aboutText: initialEditRow.aboutText || "",
        image: initialEditRow.image || "",
      };
    }
    const defaultSchoolId = isSuperAdmin ? "" : activeSchoolId ? String(activeSchoolId) : authSchoolId ? String(authSchoolId) : "";
    return { ...emptyForm, schoolId: defaultSchoolId };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(() => initialEditRow?.image || "");

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        if (isSchoolAdmin) {
          setSchools(currentSchoolOption ? [currentSchoolOption] : []);
          return;
        }
        const list = await fetchSchoolsLookup();
        setSchools(Array.isArray(list) ? list : []);
      } catch {
        setSchools([]);
      }
    };
    void loadSchools();
  }, [currentSchoolOption, isSchoolAdmin]);

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return;
    const school = findSchoolById(schools, initialEditRow.schoolId);
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(String(school.headOfficeId), String(initialEditRow.schoolId ?? ""));
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope]);

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : [];
    if (isSuperAdmin) return manualScope.schoolOptions;
    const filtered = list.filter((school) => {
      if (isHeadOfficeAdmin && authHeadOfficeId != null) {
        return String(school?.headOfficeId ?? "") === String(authHeadOfficeId);
      }
      return true;
    });
    const fallbackSchoolId = form.schoolId || authSchoolId || "";
    const fallback = fallbackSchoolId &&
      !filtered.some((school) => String(school.id) === String(fallbackSchoolId)) &&
      authSchoolName
      ? [{ id: fallbackSchoolId, schoolName: authSchoolName }]
      : [];
    return [...filtered, ...fallback];
  }, [schools, isSuperAdmin, manualScope.schoolOptions, isHeadOfficeAdmin, authHeadOfficeId, form.schoolId, authSchoolId, authSchoolName]);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setForm((prev) => ({ ...prev, image: dataUrl }));
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    const schoolId = isSuperAdmin ? manualScope.selectedSchoolId : form.schoolId;

    if (!schoolId) {
      setError("School is required");
      return;
    }
    if (!form.aboutText.trim()) {
      setError("About School text is required");
      return;
    }

    setLoading(true);
    try {
      const school = schools.find((item) => String(item.id) === String(schoolId));
      const payload = {
        headOfficeId: isSuperAdmin
          ? (manualScope.selectedHeadOfficeId ? Number(manualScope.selectedHeadOfficeId) : null)
          : (authHeadOfficeId ? Number(authHeadOfficeId) : school?.headOfficeId ?? null),
        schoolId: Number(schoolId),
        schoolName: school?.schoolName || form.schoolName || "",
        aboutText: String(form.aboutText || "").trim(),
        image: form.image || "",
      };

      if (editingId) {
        await updateAboutSchool(editingId, payload);
      } else {
        await createAboutSchool(payload);
      }

      setSuccess(true);
      setTimeout(() => onNavigate("about-school"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to save About School");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? "Edit About School" : "Add About School"}
          </h1>
          <div>
            <button type="button" className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0">
              Dashboard
            </button>
            <span className="text-secondary-light"> / {editingId ? "Edit About School" : "Add About School"}</span>
          </div>
        </div>
        <button type="button" className="btn btn-light border px-20 d-flex align-items-center gap-6" onClick={() => onNavigate("about-school")}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? <div className="alert alert-danger d-flex align-items-center gap-8" role="alert"><i className="ri-error-warning-line"></i><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success d-flex align-items-center gap-8" role="alert"><i className="ri-checkbox-circle-line"></i><span>About School {editingId ? "updated" : "saved"} successfully! Redirecting...</span></div> : null}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {isSuperAdmin ? (
                <div className="col-12 mb-20">
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
                    onSchoolChange={(value) => setForm((prev) => ({ ...prev, schoolId: value }))}
                    compact
                  />
                </div>
              ) : (
                <FormField label="School" required>
                  <select
                    id="schoolId"
                    className="form-control form-select"
                    value={form.schoolId}
                    onChange={handleChange}
                    style={{ paddingLeft: "2.5rem" }}
                    disabled={!!editingId}
                  >
                    <option value="">--Select School--</option>
                    {schoolOptions.map((school) => (
                      <option key={String(school.id)} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="About Text" required full>
                <textarea
                  id="aboutText"
                  rows={7}
                  className="form-control"
                  placeholder="Enter About School text"
                  value={form.aboutText}
                  onChange={handleChange}
                  style={{ borderRadius: "8px", paddingLeft: "1rem", minHeight: "180px" }}
                />
              </FormField>

              <div className="col-12 mb-20">
                <label className="form-label fw-semibold text-primary-light mb-8 d-block">Image</label>
                <div className="border border-neutral-300 radius-8 p-20 text-center" style={{ background: "#f9fafb" }}>
                  {imagePreview ? (
                    <img
                      src={resolveImageSrc(imagePreview)}
                      alt="Preview"
                      style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 8, marginBottom: 12 }}
                    />
                  ) : (
                    <div className="mb-12">
                      <i className="ri-image-add-line text-40 text-secondary-light" />
                    </div>
                  )}
                  <input
                    type="file"
                    className="form-control"
                    accept=".jpg,.jpeg,.png,.gif"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-secondary-light mt-8">
                    Upload a new image only if you want to replace the current one.
                  </p>
                </div>
              </div>

              <div className="col-12 d-flex justify-content-end gap-12 mt-24">
                <button type="button" className="btn btn-outline-neutral px-24 py-12 radius-8" onClick={() => onNavigate("about-school")}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-600 px-24 py-12 radius-8">
                  {loading ? "Saving..." : editingId ? "Update School" : "Save School"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AboutSchoolEdit;
