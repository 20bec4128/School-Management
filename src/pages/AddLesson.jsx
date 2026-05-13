import React, { useState, useEffect } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";
import { fetchAcademicYears } from "../apis/academicYearsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import { createLesson } from "../apis/lessonsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";

const AddLesson = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth();
  const { activeSchoolId } = useSchool();

  const [headOfficesLookup, setHeadOfficesLookup] = useState([]);
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [allSchools, setAllSchools] = useState([]);
  const [academicYearsLookup, setAcademicYearsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);

  const [commonInfo, setCommonInfo] = useState({
    headOfficeId: "",
    schoolId: "",
    academicYear: "",
    classId: "",
    subjectId: "",
  });

  const [lessons, setLessons] = useState([{ lesson: "", note: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const loadStaticLookups = async () => {
      try {
        const [ho, s] = await Promise.all([
          fetchHeadOfficesLookup(),
          fetchSchoolsLookup(),
        ]);
        setHeadOfficesLookup(ho);
        setAllSchools(s);
      } catch (err) {
        console.error("Error loading static lookups:", err);
      }
    };
    loadStaticLookups();
  }, []);

  // Filter schools when headOfficeId changes
  useEffect(() => {
    if (!commonInfo.headOfficeId) {
      setSchoolsLookup([]);
    } else {
      const filtered = allSchools.filter(
        (s) => String(s.headOfficeId) === String(commonInfo.headOfficeId),
      );
      setSchoolsLookup(filtered);
    }
  }, [commonInfo.headOfficeId, allSchools]);

  useEffect(() => {
    const loadAcademicYears = async () => {
      if (!commonInfo.schoolId || commonInfo.schoolId === "Select") {
        setAcademicYearsLookup([]);
        return;
      }
      try {
        const years = await fetchAcademicYears({
          schoolId: commonInfo.schoolId,
        });
        setAcademicYearsLookup(Array.isArray(years) ? years : []);
      } catch (err) {
        console.error("Error loading academic years:", err);
        setAcademicYearsLookup([]);
      }
    };
    loadAcademicYears();
  }, [commonInfo.schoolId]);

  useEffect(() => {
    const loadSchoolSpecificData = async () => {
      if (!commonInfo.schoolId || commonInfo.schoolId === "Select") {
        setClassesLookup([]);
        setSubjectsLookup([]);
        return;
      }
      setClassesLookup([]);
      setSubjectsLookup([]);
      try {
        const [c, sub] = await Promise.all([
          fetchClasses({ schoolId: commonInfo.schoolId }),
          fetchSubjects({ schoolId: commonInfo.schoolId }),
        ]);
        setClassesLookup(c);
        setSubjectsLookup(sub);
      } catch (err) {
        console.error("Error loading school data:", err);
        setClassesLookup([]);
        setSubjectsLookup([]);
      }
    };
    loadSchoolSpecificData();
  }, [commonInfo.schoolId]);

  const handleCommonChange = (e) => {
    const { name, value } = e.target;
    setCommonInfo((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "headOfficeId") {
        updated.schoolId = "";
        updated.academicYear = "";
        updated.classId = "";
        updated.subjectId = "";
      } else if (name === "schoolId") {
        updated.academicYear = "";
        updated.classId = "";
        updated.subjectId = "";
      }
      return updated;
    });
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
              className="text-secondary-light border-0 bg-transparent p-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>{" "}
            /{" "}
            <button
              type="button"
              className="text-secondary-light border-0 bg-transparent p-0"
              onClick={() => onNavigate?.("lesson")}
            >
              Lesson
            </button>{" "}
            / Add
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-2"
          onClick={() => onNavigate?.("lesson")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            {submitError && (
              <div className="alert alert-danger mb-24">{submitError}</div>
            )}

            <div className="row g-20 mb-32 border-bottom pb-24">
              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">
                  Head Office <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  name="headOfficeId"
                  value={commonInfo.headOfficeId}
                  onChange={handleCommonChange}
                  required
                >
                  <option value="">--Select Head Office--</option>
                  {headOfficesLookup.map((ho) => (
                    <option key={ho.id} value={ho.id}>
                      {ho.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">
                  School Name <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  name="schoolId"
                  value={commonInfo.schoolId}
                  onChange={handleCommonChange}
                  required
                  disabled={!commonInfo.headOfficeId}
                >
                  <option value="">--Select School--</option>
                  {schoolsLookup.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">
                  Class <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  name="classId"
                  value={commonInfo.classId}
                  onChange={handleCommonChange}
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
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">
                  Subject <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  name="subjectId"
                  value={commonInfo.subjectId}
                  onChange={handleCommonChange}
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
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">
                  Academic Year <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  name="academicYear"
                  value={commonInfo.academicYear}
                  onChange={handleCommonChange}
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
              </div>
            </div>

            <div className="lessons-container">
              {lessons.map((lesson, index) => (
                <div
                  key={index}
                  className="lesson-row p-20 border rounded-3 mb-20 position-relative bg-light-50"
                >
                  <div className="d-flex justify-content-between align-items-center mb-16">
                    <h6 className="mb-0 text-primary-light">
                      Lesson {index + 1}
                    </h6>
                    {lessons.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger border-0"
                        onClick={() => removeLesson(index)}
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    )}
                  </div>
                  <div className="row g-20">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-primary-light">
                        Lesson
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Lesson"
                        value={lesson.lesson}
                        onChange={(e) =>
                          handleLessonChange(index, "lesson", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-primary-light">
                        Note
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Note"
                        value={lesson.note}
                        onChange={(e) =>
                          handleLessonChange(index, "note", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-24">
              <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                onClick={addMoreLesson}
              >
                <i className="ri-add-line"></i> Add More
              </button>
              <div className="d-flex gap-12">
                <button
                  type="button"
                  className="btn btn-light border px-32"
                  onClick={() => onNavigate?.("lesson")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-600 px-32"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Lessons"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLesson;
