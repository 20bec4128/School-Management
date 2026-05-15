import React, { useState, useEffect, useMemo, useRef } from "react";
import { fetchClasses } from "../apis/classesApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchSubjects } from "../apis/subjectsApi";
import {
  createStudyMaterial,
  updateStudyMaterial,
} from "../apis/studyMaterialsApi";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { findSchoolById } from "../utils/schoolScope";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "edit-study-material-row";
const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.txt";
const ACCEPTED_DOC_LABEL = ".pdf, .doc/docx, .ppt/pptx or .txt";

const emptyForm = {
  schoolId: "",
  classId: "",
  subjectId: "",
  title: "",
  description: "",
};

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Class: "ri-building-line",
  Subject: "ri-book-open-line",
  Title: "ri-file-list-2-line",
  Description: "ri-align-left",
  Material: "ri-attachment-2",
};

const getExistingFileName = (row) =>
  row?.fileName ||
  String(row?.fileUrl || row?.materialUrl || row?.filePath || "")
    .split("/")
    .filter(Boolean)
    .pop() ||
  "";

const getExistingFileUrl = (row) =>
  row?.fileUrl ||
  row?.materialUrl ||
  row?.filePath ||
  row?.attachmentUrl ||
  row?.url ||
  "";

const FormField = ({
  label,
  required,
  children,
  full = false,
  noIcon = false,
}) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={full ? "col-12 mb-20" : "col-md-6 mb-20"}>
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
      <div className="avm-input-with-icon" style={{ position: "relative" }}>
        {!noIcon && (
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
        )}
        {children}
      </div>
    </div>
  );
};

const AddStudyMaterial = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth();
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool();
  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [schools, setSchools] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState(() =>
    initialEditRow ? getExistingFileName(initialEditRow) : "",
  );
  const [filePreviewUrl, setFilePreviewUrl] = useState(() =>
    initialEditRow ? getExistingFileUrl(initialEditRow) : "",
  );

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...initialEditRow,
        schoolId: initialEditRow.schoolId
          ? String(initialEditRow.schoolId)
          : "",
        classId: initialEditRow.classId ? String(initialEditRow.classId) : "",
        subjectId: initialEditRow.subjectId
          ? String(initialEditRow.subjectId)
          : "",
      };
    }
    const listSchoolId = isSuperAdmin
      ? activeSchoolId
        ? String(activeSchoolId)
        : ""
      : authSchoolId
        ? String(authSchoolId)
        : "";
    return { ...emptyForm, schoolId: listSchoolId };
  });

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  useEffect(() => {
    fetchSchoolsLookup()
      .then(setSchools)
      .catch(() => setSchools([]));
  }, []);

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schools.length === 0) return;
    const school = findSchoolById(schools, initialEditRow.schoolId);
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(
        String(school.headOfficeId),
        String(initialEditRow.schoolId ?? ""),
      );
    }
  }, [initialEditRow, isSuperAdmin, schools, manualScope]);

  useEffect(() => {
    let cancelled = false;
    const loadClasses = async () => {
      if (!form.schoolId) {
        setClassesLookup([]);
        return;
      }
      try {
        const data = await fetchClasses({ schoolId: form.schoolId });
        if (!cancelled) setClassesLookup(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setClassesLookup([]);
      }
    };
    loadClasses();
    return () => {
      cancelled = true;
    };
  }, [form.schoolId]);

  useEffect(() => {
    let cancelled = false;
    const loadSubjects = async () => {
      if (!form.schoolId || !form.classId) {
        setSubjectsLookup([]);
        return;
      }
      try {
        const data = await fetchSubjects({
          schoolId: form.schoolId,
          classId: form.classId,
        });
        if (!cancelled) setSubjectsLookup(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSubjectsLookup([]);
      }
    };
    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [form.schoolId, form.classId]);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    return contextSchoolOptions || [];
  }, [isSuperAdmin, manualScope.schoolOptions, contextSchoolOptions]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    const nextFile = e.target.files?.[0] || null;
    if (filePreviewUrl && filePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFile(nextFile);
    setSelectedFileName(nextFile?.name || getExistingFileName(initialEditRow) || "");
    setFilePreviewUrl(nextFile ? URL.createObjectURL(nextFile) : getExistingFileUrl(initialEditRow) || "");
  };

  const handleChooseFile = () => {
    fileRef.current?.click();
  };

  const handleViewFile = () => {
    if (!filePreviewUrl) return;
    window.open(filePreviewUrl, "_blank", "noreferrer");
  };

  useEffect(() => {
    return () => {
      if (filePreviewUrl && filePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    if (!form.schoolId) {
      setError("School is required");
      return;
    }
    if (!form.classId) {
      setError("Class is required");
      return;
    }
    if (!form.subjectId) {
      setError("Subject is required");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        classId: Number(form.classId),
        subjectId: Number(form.subjectId),
        title: form.title,
        description: form.description,
      };
      if (initialEditRow) {
        await updateStudyMaterial(initialEditRow.id, payload, file);
      } else {
        await createStudyMaterial(payload, file);
      }
      setSuccess(true);
      setTimeout(() => onNavigate("study-material"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to process study material");
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(initialEditRow);

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditing ? "Edit" : "Add"} Study Material
          </h1>
          <span className="text-secondary-light">
            Academic / Study Material / {isEditing ? "Edit" : "Add"}
          </span>
        </div>
        <button
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate("study-material")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-checkbox-circle-line text-lg" />
          Study material {isEditing ? "updated" : "created"} successfully!
          Redirecting...
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row g-20">
              {isSuperAdmin ? (
                <div className="col-12 mb-20">
                  <ManualScopeSelectors
                    enabled={isSuperAdmin}
                    headOffices={manualScope.headOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(val) => {
                      manualScope.setSelectedHeadOfficeId(val);
                      setForm((p) => ({
                        ...p,
                        schoolId: "",
                        classId: "",
                        subjectId: "",
                      }));
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(val) =>
                      setForm((p) => ({
                        ...p,
                        schoolId: val,
                        classId: "",
                        subjectId: "",
                      }))
                    }
                    compact
                  />
                </div>
              ) : (
                <FormField label="School Name" required>
                  <select
                    className="form-control form-select ps-40"
                    id="schoolId"
                    value={form.schoolId}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        schoolId: e.target.value,
                        classId: "",
                        subjectId: "",
                      }))
                    }
                  >
                    <option value="">--Select School--</option>
                    {schoolOptions.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Class" required>
                <select
                  id="classId"
                  className="form-control form-select ps-40"
                  value={form.classId}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      classId: e.target.value,
                      subjectId: "",
                    }))
                  }
                  disabled={!form.schoolId}
                >
                  <option value="">--Select Class--</option>
                  {classesLookup.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Subject" required >
                <select
                  id="subjectId"
                  className="form-control form-select ps-40"
                  value={form.subjectId}
                  onChange={handleChange}
                  disabled={!form.classId}
                >
                  <option value="">--Select Subject--</option>
                  {subjectsLookup.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Title" required full>
                <input
                  type="text"
                  id="title"
                  className="form-control ps-40"
                  placeholder="Title"
                  value={form.title}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Description" full noIcon>
                <textarea
                  id="description"
                  rows="4"
                  className="form-control pt-10"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Material" full noIcon>
                <div className="d-flex flex-column gap-10">
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPTED_DOC_TYPES}
                    className="d-none"
                    onChange={handleFileChange}
                  />
                  <div className="d-flex flex-wrap flex-md-nowrap align-items-center gap-10">
                    <button
                      type="button"
                      className="btn btn-light border px-16 d-inline-flex align-items-center gap-8 text-nowrap"
                      onClick={handleChooseFile}
                    >
                      <i className="ri-attachment-2"></i>
                      {selectedFileName ? "Change File" : "Choose File"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary w-40-px h-40-px d-inline-flex align-items-center justify-content-center rounded-circle"
                      onClick={handleViewFile}
                      disabled={!filePreviewUrl}
                      title="View selected file"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    <span className="text-secondary-light text-sm text-nowrap">
                      {selectedFileName || "No file selected"}
                    </span>
                  </div>
                  <div className="text-secondary-light text-sm">
                    Accepted: {ACCEPTED_DOC_LABEL}
                  </div>
                </div>
              </FormField>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
              <button
                type="button"
                className="btn btn-light border px-24"
                onClick={() => onNavigate("study-material")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-24 d-flex align-items-center gap-8"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>{" "}
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" />{" "}
                    {isEditing ? "Update" : "Save"} Study Material
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudyMaterial;
