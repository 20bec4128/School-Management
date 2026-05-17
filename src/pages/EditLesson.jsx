import React, { useEffect, useState, useMemo } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";
import { fetchAcademicYears } from "../apis/academicYearsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import { updateLesson } from "../apis/lessonsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import "../assets/css/addModalShared.css";

const STORAGE_KEY = "sm_edit_lesson";

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  "Academic Year": "ri-calendar-line",
  Class: "ri-building-line",
  Subject: "ri-book-open-line",
  Lesson: "ri-file-list-3-line",
  Note: "ri-sticky-note-line",
};

const FormField = ({
  label,
  required,
  children,
  full = false,
  noIcon = false,
}) => {
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
        <div className="avm-input-no-icon">{children}</div>
      )}
    </div>
  );
};

const readEditLesson = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const EditLesson = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();
  const { activeSchoolId } = useSchool();
  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [academicYearsLookup, setAcademicYearsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [commonInfo, setCommonInfo] = useState({
    schoolId: "",
    academicYear: "",
    classId: "",
    subjectId: "",
  });
  const [lessonForm, setLessonForm] = useState({
    lesson: "",
    note: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const existing = readEditLesson();
    if (!existing?.id) {
      onNavigate?.("lesson");
      return;
    }

    setEditingId(existing.id);
    setCommonInfo({
      schoolId: existing.schoolId != null ? String(existing.schoolId) : "",
      academicYear: existing.academicYear || "",
      classId: existing.classId != null ? String(existing.classId) : "",
      subjectId: existing.subjectId != null ? String(existing.subjectId) : "",
    });
    setLessonForm({
      lesson: existing.lesson || "",
      note: existing.note || "",
    });

    if (isSuperAdmin && existing.headOfficeId) {
      manualScope.setSelectedScope(String(existing.headOfficeId), String(existing.schoolId));
    }
  }, [onNavigate, isSuperAdmin]);

  useEffect(() => {
    const loadStatic = async () => {
      try {
        const s = await fetchSchoolsLookup();
        setSchoolsLookup(s);
      } catch (err) {
        console.error("Error loading static lookups:", err);
      }
    };
    loadStatic();
  }, []);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    return Array.isArray(schoolsLookup) ? schoolsLookup : [];
  }, [isSuperAdmin, manualScope.schoolOptions, schoolsLookup]);

  useEffect(() => {
    const sid = commonInfo.schoolId;
    if (!sid || sid === "Select") {
      setAcademicYearsLookup([]);
      setClassesLookup([]);
      setSubjectsLookup([]);
      return;
    }
    const loadSchoolSpecificData = async () => {
      try {
        const [years, c, sub] = await Promise.all([
          fetchAcademicYears({ schoolId: sid }),
          fetchClasses({ schoolId: sid }),
          fetchSubjects({ schoolId: sid }),
        ]);
        setAcademicYearsLookup(Array.isArray(years) ? years : []);
        setClassesLookup(Array.isArray(c) ? c : []);
        setSubjectsLookup(Array.isArray(sub) ? sub : []);
      } catch (err) {
        console.error("Error loading school data:", err);
      }
    };
    loadSchoolSpecificData();
  }, [commonInfo.schoolId]);

  const handleCommonChange = (field, value) => {
    setCommonInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateLesson(editingId, {
        schoolId: Number(commonInfo.schoolId),
        academicYear: commonInfo.academicYear,
        classId: Number(commonInfo.classId),
        subjectId: Number(commonInfo.subjectId),
        lesson: lessonForm.lesson,
        note: lessonForm.note,
      });
      sessionStorage.removeItem(STORAGE_KEY);
      onNavigate?.("lesson");
    } catch (err) {
      setSubmitError(err.message || "Failed to update lesson");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Edit Lesson</h1>
          <div className="text-secondary-light">
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent p-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>{" "}
            /{" "}
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent p-0"
              onClick={() => onNavigate?.("lesson")}
            >
              Lesson
            </button>{" "}
            / Edit
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("lesson")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            {submitError && (
              <div className="alert alert-danger mb-24 d-flex align-items-center gap-10 radius-8">
                <i className="ri-error-warning-line text-lg" />
                {submitError}
              </div>
            )}

            <p className="avm-section-title">Scope & Selection</p>
            <div className="row g-20">
              {isSuperAdmin ? (
                <div className="col-12 mb-20">
                  <ManualScopeSelectors
                    enabled={isSuperAdmin}
                    headOffices={manualScope.headOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(val) => {
                      manualScope.setSelectedScope(val, "");
                      handleCommonChange("schoolId", "Select");
                    }}
                    selectedSchoolId={commonInfo.schoolId}
                    onSchoolChange={(val) => handleCommonChange("schoolId", val)}
                    compact
                  />
                </div>
              ) : (
                <div className="col-12 avm-grid">
                  <FormField label="Head Office" required>
                    <input
                      className="form-control avm-input ps-44"
                      value={authHeadOfficeName || ""}
                      readOnly
                    />
                  </FormField>
                  <FormField label="School Name" required>
                    <input
                      className="form-control avm-input ps-44"
                      value={
                        schoolsLookup.find(
                          (s) => String(s.id) === String(commonInfo.schoolId),
                        )?.schoolName ||
                        authSchoolName ||
                        ""
                      }
                      readOnly
                    />
                  </FormField>
                </div>
              )}

              <div className="col-12 avm-grid mt-8">
                <FormField label="Academic Year" required>
                  <select
                    className="form-select avm-input ps-44"
                    value={commonInfo.academicYear}
                    onChange={(e) =>
                      handleCommonChange("academicYear", e.target.value)
                    }
                    required
                    disabled={!commonInfo.schoolId}
                  >
                    <option value="">--Select Academic Year--</option>
                    {academicYearsLookup.map((year) => (
                      <option key={year.id} value={year.academicYear}>
                        {year.academicYear}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Class" required>
                  <select
                    className="form-select avm-input ps-44"
                    value={commonInfo.classId}
                    onChange={(e) =>
                      handleCommonChange("classId", e.target.value)
                    }
                    required
                    disabled={!commonInfo.schoolId}
                  >
                    <option value="">--Select--</option>
                    {classesLookup.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Subject" required>
                  <select
                    className="form-select avm-input ps-44"
                    value={commonInfo.subjectId}
                    onChange={(e) =>
                      handleCommonChange("subjectId", e.target.value)
                    }
                    required
                    disabled={!commonInfo.schoolId}
                  >
                    <option value="">--Select--</option>
                    {subjectsLookup.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.subjectName}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            <div className="mt-32 pt-24 border-top">
              <p className="avm-section-title">Lesson Details</p>
              <div className="row g-20">
                <div className="col-12 avm-grid">
                  <FormField label="Lesson" required>
                    <input
                      type="text"
                      className="form-control avm-input ps-44"
                      placeholder="Enter lesson name"
                      value={lessonForm.lesson}
                      onChange={(e) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          lesson: e.target.value,
                        }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Note">
                    <input
                      type="text"
                      className="form-control avm-input ps-44"
                      placeholder="Optional note"
                      value={lessonForm.note}
                      onChange={(e) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.("lesson")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32 d-flex align-items-center gap-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>{" "}
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" /> Update Lesson
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

export default EditLesson;
