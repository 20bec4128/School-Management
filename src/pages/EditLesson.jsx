import { useEffect, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";
import { fetchAcademicYears } from "../apis/academicYearsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import { updateLesson } from "../apis/lessonsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";

const STORAGE_KEY = "sm_edit_lesson";

const readEditLesson = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const EditLesson = ({ onNavigate }) => {
  const { role } = useAuth();
  const { activeSchoolId } = useSchool();

  const [headOfficesLookup, setHeadOfficesLookup] = useState([]);
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [allSchools, setAllSchools] = useState([]);
  const [academicYearsLookup, setAcademicYearsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [commonInfo, setCommonInfo] = useState({
    headOfficeId: "",
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
      headOfficeId: existing.headOfficeId != null ? String(existing.headOfficeId) : "",
      schoolId: existing.schoolId != null ? String(existing.schoolId) : "",
      academicYear: existing.academicYear || "",
      classId: existing.classId != null ? String(existing.classId) : "",
      subjectId: existing.subjectId != null ? String(existing.subjectId) : "",
    });
    setLessonForm({
      lesson: existing.lesson || "",
      note: existing.note || "",
    });
  }, [onNavigate]);

  useEffect(() => {
    const loadStaticLookups = async () => {
      try {
        const [ho, s] = await Promise.all([fetchHeadOfficesLookup(), fetchSchoolsLookup()]);
        setHeadOfficesLookup(ho);
        setAllSchools(s);
      } catch (err) {
        console.error("Error loading static lookups:", err);
      }
    };
    loadStaticLookups();
  }, []);

  useEffect(() => {
    if (!commonInfo.headOfficeId) {
      setSchoolsLookup(allSchools);
      return;
    }
    const filtered = allSchools.filter((s) => String(s.headOfficeId) === String(commonInfo.headOfficeId));
    setSchoolsLookup(filtered);
  }, [commonInfo.headOfficeId, allSchools]);

  useEffect(() => {
    if (commonInfo.headOfficeId || !commonInfo.schoolId || !allSchools.length) return;
    const matchedSchool = allSchools.find((school) => String(school.id) === String(commonInfo.schoolId));
    if (matchedSchool?.headOfficeId != null) {
      setCommonInfo((prev) => ({ ...prev, headOfficeId: String(matchedSchool.headOfficeId) }));
    }
  }, [allSchools, commonInfo.headOfficeId, commonInfo.schoolId]);

  useEffect(() => {
    const loadSchoolData = async () => {
      if (!commonInfo.schoolId || commonInfo.schoolId === "Select") {
        setAcademicYearsLookup([]);
        setClassesLookup([]);
        setSubjectsLookup([]);
        return;
      }

      try {
        const [years, classes, subjects] = await Promise.all([
          fetchAcademicYears({ schoolId: commonInfo.schoolId }),
          fetchClasses({ schoolId: commonInfo.schoolId }),
          fetchSubjects({ schoolId: commonInfo.schoolId }),
        ]);
        setAcademicYearsLookup(Array.isArray(years) ? years : []);
        setClassesLookup(Array.isArray(classes) ? classes : []);
        setSubjectsLookup(Array.isArray(subjects) ? subjects : []);
      } catch (err) {
        console.error("Error loading school-specific data:", err);
        setAcademicYearsLookup([]);
        setClassesLookup([]);
        setSubjectsLookup([]);
      }
    };

    loadSchoolData();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) {
      setSubmitError("Missing lesson to update");
      return;
    }

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
            <button type="button" className="text-secondary-light border-0 bg-transparent p-0" onClick={() => onNavigate?.("dashboard")}>
              Dashboard
            </button>{" "}
            /{" "}
            <button type="button" className="text-secondary-light border-0 bg-transparent p-0" onClick={() => onNavigate?.("lesson")}>
              Lesson
            </button>{" "}
            / Edit
          </div>
        </div>
        <button type="button" className="btn btn-light border d-flex align-items-center gap-2" onClick={() => onNavigate?.("lesson")}>
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            {submitError ? <div className="alert alert-danger mb-24">{submitError}</div> : null}

            <div className="row g-20 mb-32 border-bottom pb-24">
              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">Head Office <span className="text-danger">*</span></label>
                <select className="form-control form-select" name="headOfficeId" value={commonInfo.headOfficeId} onChange={handleCommonChange} required>
                  <option value="">--Select Head Office--</option>
                  {headOfficesLookup.map((ho) => (
                    <option key={ho.id} value={ho.id}>{ho.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">School Name <span className="text-danger">*</span></label>
                <select className="form-control form-select" name="schoolId" value={commonInfo.schoolId} onChange={handleCommonChange} required disabled={!commonInfo.headOfficeId}>
                  <option value="">--Select School--</option>
                  {schoolsLookup.map((s) => (
                    <option key={s.id} value={s.id}>{s.schoolName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">Academic Year <span className="text-danger">*</span></label>
                <select className="form-control form-select" name="academicYear" value={commonInfo.academicYear} onChange={handleCommonChange} required disabled={!commonInfo.schoolId}>
                  <option value="">--Select Academic Year--</option>
                  {academicYearsLookup.map((year) => (
                    <option key={year.id} value={year.academicYear}>{year.academicYear}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">Class <span className="text-danger">*</span></label>
                <select className="form-control form-select" name="classId" value={commonInfo.classId} onChange={handleCommonChange} required disabled={!commonInfo.schoolId}>
                  <option value="">--Select--</option>
                  {classesLookup.map((c) => (
                    <option key={c.id} value={c.id}>{c.className}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold text-primary-light">Subject <span className="text-danger">*</span></label>
                <select className="form-control form-select" name="subjectId" value={commonInfo.subjectId} onChange={handleCommonChange} required disabled={!commonInfo.schoolId}>
                  <option value="">--Select--</option>
                  {subjectsLookup.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.subjectName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lesson-row p-20 border rounded-3 mb-20 bg-light-50">
              <div className="row g-20">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-primary-light">Lesson</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Lesson"
                    value={lessonForm.lesson}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, lesson: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-primary-light">Note</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Note"
                    value={lessonForm.note}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end align-items-center mt-24 gap-12">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate?.("lesson")}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Lesson"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLesson;
