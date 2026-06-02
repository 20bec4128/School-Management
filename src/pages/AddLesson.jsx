import React, { useState, useEffect, useMemo } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";
import { fetchAcademicYears } from "../apis/academicYearsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import { createLesson } from "../apis/lessonsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import "../assets/css/addModalShared.css";

const LESSON_LIST_SCOPE_KEY = "sm_lesson_list_scope";

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

const AddLesson = ({ onNavigate }) => {
  const {
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();
  const { activeSchoolId } = useSchool();
  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const isSchoolAdmin = String(role || "").toUpperCase() === "SCHOOL_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null;
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    };
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isSchoolAdmin]);

  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [academicYearsLookup, setAcademicYearsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);

  const [commonInfo, setCommonInfo] = useState({
    schoolId: "",
    academicYear: "",
    classId: "",
    subjectId: "",
  });

  const [lessons, setLessons] = useState([{ lesson: "", note: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const loadStatic = async () => {
      try {
        if (isSchoolAdmin) {
          setSchoolsLookup(currentSchoolOption ? [currentSchoolOption] : []);
          return;
        }
        const s = await fetchSchoolsLookup();
        setSchoolsLookup(s);
      } catch (err) {
        console.error("Error loading static lookups:", err);
        setSchoolsLookup(isSchoolAdmin && currentSchoolOption ? [currentSchoolOption] : []);
      }
    };
    loadStatic();
  }, [currentSchoolOption, isSchoolAdmin]);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    if (isSchoolAdmin) return currentSchoolOption ? [currentSchoolOption] : [];
    return Array.isArray(schoolsLookup) ? schoolsLookup : [];
  }, [currentSchoolOption, isSchoolAdmin, isSuperAdmin, manualScope.schoolOptions, schoolsLookup]);

  useEffect(() => {
    const sid = isSuperAdmin
      ? manualScope.selectedSchoolId
      : activeSchoolId || authSchoolId;
    if (sid) {
      setCommonInfo((prev) => ({ ...prev, schoolId: String(sid) }));
    }
  }, [
    isSuperAdmin,
    manualScope.selectedSchoolId,
    activeSchoolId,
    authSchoolId,
  ]);

  useEffect(() => {
    const loadSchoolSpecificData = async () => {
      const sid = commonInfo.schoolId;
      if (!sid || sid === "Select") {
        setAcademicYearsLookup([]);
        setClassesLookup([]);
        setSubjectsLookup([]);
        return;
      }
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
        setAcademicYearsLookup([]);
        setClassesLookup([]);
        setSubjectsLookup([]);
      }
    };
    loadSchoolSpecificData();
  }, [commonInfo.schoolId]);

  const handleCommonChange = (field, value) => {
    setCommonInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleLessonChange = (index, field, value) => {
    const updated = [...lessons];
    updated[index][field] = value;
    setLessons(updated);
  };

  const addMoreLesson = () => {
    setLessons([...lessons, { lesson: "", note: "" }]);
  };

  const removeLesson = (index) => {
    if (lessons.length > 1) {
      setLessons(lessons.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const promises = lessons.map((l) =>
        createLesson({
          ...commonInfo,
          lesson: l.lesson,
          note: l.note,
          schoolId: Number(commonInfo.schoolId),
          academicYear: commonInfo.academicYear,
          classId: Number(commonInfo.classId),
          subjectId: Number(commonInfo.subjectId),
        }),
      );
      await Promise.all(promises);
      try {
        sessionStorage.setItem(
          LESSON_LIST_SCOPE_KEY,
          JSON.stringify({
            schoolId: String(commonInfo.schoolId || ""),
          }),
        );
      } catch {
        // ignore
      }
      onNavigate?.("lesson");
    } catch (err) {
      setSubmitError(err.message || "Failed to save lessons");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Lesson</h1>
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
            / Add
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
              <div className="d-flex justify-content-between align-items-center mb-16">
                <p className="avm-section-title mb-0">Lesson Details</p>
                <button
                  type="button"
                  className="btn btn-primary-600 btn-sm d-flex align-items-center gap-8"
                  onClick={addMoreLesson}
                >
                  <i className="ri-add-line"></i> Add More
                </button>
              </div>

              <div className="lessons-container">
                {lessons.map((lesson, index) => (
                  <div
                    key={index}
                    className="lesson-row p-20 border rounded-3 mb-20 position-relative bg-light-50"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-16">
                      <h6 className="mb-0 text-sm fw-bold text-primary-light">
                        Lesson #{index + 1}
                      </h6>
                      {lessons.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 d-flex align-items-center gap-4"
                          onClick={() => removeLesson(index)}
                        >
                          <i className="ri-delete-bin-line"></i> Remove
                        </button>
                      )}
                    </div>
                    <div className="row g-20">
                      <div className="col-12 avm-grid">
                        <FormField label="Lesson" required>
                          <input
                            type="text"
                            className="form-control avm-input ps-44"
                            placeholder="Enter lesson name"
                            value={lesson.lesson}
                            onChange={(e) =>
                              handleLessonChange(
                                index,
                                "lesson",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </FormField>
                        <FormField label="Note">
                          <input
                            type="text"
                            className="form-control avm-input ps-44"
                            placeholder="Optional note"
                            value={lesson.note}
                            onChange={(e) =>
                              handleLessonChange(index, "note", e.target.value)
                            }
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" /> Save Lessons
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

export default AddLesson;
