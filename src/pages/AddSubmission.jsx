import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WizardPopup from "../components/WizardPopup";
import { createSubmission, updateSubmission } from "../apis/submissionsApi";
import {
  fetchAssignments,
  fetchAssignmentsForStudent,
} from "../apis/assignmentsApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSections } from "../apis/sectionsApi";
import {
  fetchStudentsByClassSection,
  fetchStudentsPage,
} from "../apis/studentsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { findSchoolById } from "../utils/schoolScope";
import { getParentChildScope } from "../utils/parentChildScope";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "edit-submission-row";
const STEPS = ["Submission Info"];
const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png";
const ACCEPTED_DOC_LABEL = "pdf/doc/ppt/txt or image";

const emptyForm = {
  schoolId: "Select",
  classId: "Select",
  sectionId: "Select",
  studentId: "Select",
  assignmentId: "Select",
  note: "",
};

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Class: "ri-building-line",
  Section: "ri-layout-grid-line",
  Student: "ri-user-3-line",
  Assignment: "ri-book-open-line",
  Submission: "ri-upload-2-line",
  Note: "ri-sticky-note-line",
};

const getBestLabel = (...values) =>
  values
    .map((value) => {
      if (value == null) return "";
      const text = String(value).trim();
      return text === "null" || text === "undefined" ? "" : text;
    })
    .find(Boolean) || "";

const getFileNameFromUrl = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const clean = text.split("?")[0].split("#")[0];
  const parts = clean.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
};

const rowMatchesSchool = (row, schoolId) => {
  const targetId = schoolId != null && schoolId !== "" ? String(schoolId) : "";
  const rowSchoolId =
    row?.schoolId ?? row?.school?.id ?? row?.school?.schoolId ?? null;
  return targetId && rowSchoolId != null && String(rowSchoolId) === targetId;
};

const rowMatchesClass = (row, classId) => {
  const targetId = classId != null && classId !== "" ? String(classId) : "";
  const rowClassId =
    row?.id ??
    row?.classId ??
    row?.schoolClass?.id ??
    row?.schoolClassId ??
    null;
  return targetId && rowClassId != null && String(rowClassId) === targetId;
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
        children
      )}
    </div>
  );
};

const AddSubmission = ({ onNavigate }) => {
  const {
    user,
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    studentId,
    parentChildren,
    selectedChildId,
    studentClassId,
    studentSectionId,
  } = useAuth();
  const { activeSchoolId } = useSchool();
  const roleUpper = String(role || "").toUpperCase();
  const isTeacher = roleUpper === "TEACHER";
  const isStudent = roleUpper === "STUDENT";
  const isParent = roleUpper === "PARENT";
  const isSuperAdmin = roleUpper === "SUPER_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

  const selectedChild = useMemo(() => {
    if (!isParent || !selectedChildId) return null;
    return (parentChildren || []).find(
      (c) => String(c.studentId || c.id) === String(selectedChildId),
    );
  }, [isParent, parentChildren, selectedChildId]);
  const parentScope = useMemo(() => getParentChildScope(parentChildren, selectedChildId), [parentChildren, selectedChildId]);
  const isParentMultiChildScope = isParent && parentScope.isAllChildrenSelected;

  const fixedStudentId = isStudent
    ? studentId
    : isParent
      ? selectedChild?.studentId || selectedChild?.id
      : null;
  const fixedSchoolId = isStudent
    ? authSchoolId
    : isParent
      ? selectedChild?.schoolId
      : activeSchoolId || authSchoolId;
  const fixedClassId = isStudent
    ? studentClassId
    : isParent
      ? selectedChild?.classId
      : null;
  const fixedSectionId = isStudent
    ? studentSectionId
    : isParent
      ? selectedChild?.sectionId
      : null;

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const editingId = initialEditRow?.id ?? null;

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        schoolId:
          initialEditRow.schoolId != null
            ? String(initialEditRow.schoolId)
            : "Select",
        classId:
          initialEditRow.classId != null
            ? String(initialEditRow.classId)
            : "Select",
        sectionId:
          initialEditRow.sectionId != null
            ? String(initialEditRow.sectionId)
            : "Select",
        studentId:
          initialEditRow.studentId != null
            ? String(initialEditRow.studentId)
            : "Select",
        assignmentId:
          initialEditRow.assignmentId != null
            ? String(initialEditRow.assignmentId)
            : "Select",
        note: initialEditRow.note || "",
      };
    }
    return {
      ...emptyForm,
      schoolId: fixedSchoolId ? String(fixedSchoolId) : "Select",
      classId: fixedClassId ? String(fixedClassId) : "Select",
      sectionId: fixedSectionId ? String(fixedSectionId) : "Select",
      studentId: fixedStudentId ? String(fixedStudentId) : "Select",
    };
  });

  const [file, setFile] = useState(null);
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [sectionsLookup, setSectionsLookup] = useState([]);
  const [studentsLookup, setStudentsLookup] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState(() =>
    getFileNameFromUrl(initialEditRow?.fileUrl) || "",
  );
  const [filePreviewUrl, setFilePreviewUrl] = useState(
    initialEditRow?.fileUrl || "",
  );
  const fileRef = useRef(null);

  useEffect(
    () => () => {
      if (filePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    },
    [filePreviewUrl],
  );

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin || schoolsLookup.length === 0) return;
    const school = findSchoolById(schoolsLookup, initialEditRow.schoolId);
    const headOfficeId =
      initialEditRow.headOfficeId != null
        ? String(initialEditRow.headOfficeId)
        : school?.headOfficeId != null
          ? String(school.headOfficeId)
          : "";
    if (headOfficeId) {
      manualScope.setSelectedScope(
        headOfficeId,
        initialEditRow.schoolId != null ? String(initialEditRow.schoolId) : "",
      );
    }
  }, [initialEditRow, isSuperAdmin, manualScope, schoolsLookup]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const schools = await fetchSchoolsLookup();
        setSchoolsLookup(Array.isArray(schools) ? schools : []);
      } catch {
        setSchoolsLookup([]);
      }
    };
    loadLookups();
  }, []);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    return Array.isArray(schoolsLookup) ? schoolsLookup : [];
  }, [isSuperAdmin, manualScope.schoolOptions, schoolsLookup]);

  useEffect(() => {
    if (form.schoolId === "Select") return;
    const load = async () => {
      setLoading(true);
      try {
        const [classes, sections, asgs] = await Promise.all([
          fetchClasses({ schoolId: form.schoolId }).catch(() => []),
          fetchSections({ schoolId: form.schoolId }).catch(() => []),
          fixedStudentId
            ? fetchAssignmentsForStudent(fixedStudentId).catch(() => [])
            : fetchAssignments().catch(() => []),
        ]);
        setClassesLookup(Array.isArray(classes) ? classes : []);
        setSectionsLookup(Array.isArray(sections) ? sections : []);
        setAssignments(Array.isArray(asgs) ? asgs : []);
      } catch {
        setClassesLookup([]);
        setSectionsLookup([]);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [form.schoolId, fixedStudentId]);

  useEffect(() => {
    if (fixedStudentId || isStudent || isParent) {
      setStudentsLookup([]);
      return;
    }
    if (
      form.schoolId === "Select" ||
      form.classId === "Select" ||
      form.sectionId === "Select"
    ) {
      setStudentsLookup([]);
      return;
    }
    const loadStudents = async () => {
      try {
        const students = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
          sectionId: form.sectionId,
        });
        setStudentsLookup(Array.isArray(students) ? students : []);
      } catch {
        setStudentsLookup([]);
      }
    };
    loadStudents();
  }, [form.schoolId, form.classId, form.sectionId, fixedStudentId, isStudent, isParent]);

  const handleChange = (id, value) => {
    setForm((prev) => {
      if (id === "schoolId")
        return {
          ...prev,
          schoolId: value,
          classId: "Select",
          sectionId: "Select",
          studentId: "Select",
          assignmentId: "Select",
        };
      if (id === "classId")
        return {
          ...prev,
          classId: value,
          sectionId: "Select",
          studentId: "Select",
          assignmentId: "Select",
        };
      if (id === "sectionId")
        return {
          ...prev,
          sectionId: value,
          studentId: "Select",
          assignmentId: "Select",
        };
      return { ...prev, [id]: value };
    });
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    if (filePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    if (nextFile) {
      setSelectedFileName(nextFile.name);
      setFilePreviewUrl(URL.createObjectURL(nextFile));
    } else {
      setSelectedFileName(getFileNameFromUrl(initialEditRow?.fileUrl) || "");
      setFilePreviewUrl(initialEditRow?.fileUrl || "");
    }
    setFile(nextFile);
  };

  const handleViewFile = () => {
    if (!filePreviewUrl) return;
    window.open(filePreviewUrl, "_blank", "noopener,noreferrer");
  };

  const validate = () => {
    if (form.schoolId === "Select") return "School is required.";
    if (form.classId === "Select") return "Class is required.";
    if (form.sectionId === "Select") return "Section is required.";
    if (form.studentId === "Select") return "Student is required.";
    if (form.assignmentId === "Select") return "Assignment is required.";
    if (!editingId && !file) return "Submission file is required.";
    return "";
  };

  const save = async () => {
    if (isParentMultiChildScope) {
      setError("Select one child from the top bar to create a submission.");
      return;
    }
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        classId: Number(form.classId),
        sectionId: Number(form.sectionId),
        studentId: Number(form.studentId),
        assignmentId: Number(form.assignmentId),
        note: form.note || null,
      };
      if (editingId) {
        await updateSubmission(editingId, payload, file);
      } else {
        await createSubmission(payload, file);
      }
      setSuccess(true);
      setTimeout(() => onNavigate?.("submission"), 900);
    } catch (err) {
      setError(err?.message || "Failed to save submission");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <>
          {isParentMultiChildScope ? (
            <div className="alert alert-info mb-20">
              Select one child from the top bar before creating a submission.
            </div>
          ) : null}
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
                  handleChange("schoolId", "Select");
                }}
                selectedSchoolId={form.schoolId}
                onSchoolChange={(val) => handleChange("schoolId", val)}
                compact
              />
            </div>
          ) : (
            <div className="avm-grid">
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
                      (s) => String(s.id) === String(form.schoolId),
                    )?.schoolName ||
                    authSchoolName ||
                    ""
                  }
                  readOnly
                />
              </FormField>
            </div>
          )}

          <div className="avm-grid">
            <FormField label="Class" required>
              <select
                className="form-select avm-input ps-44"
                value={form.classId}
                onChange={(e) => handleChange("classId", e.target.value)}
                disabled={fixedClassId || editingId || form.schoolId === "Select"}
              >
                <option value="Select">Select Class</option>
                {classesLookup.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.className}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Section" required>
              <select
                className="form-select avm-input ps-44"
                value={form.sectionId}
                onChange={(e) => handleChange("sectionId", e.target.value)}
                disabled={
                  fixedSectionId || editingId || form.classId === "Select"
                }
              >
                <option value="Select">Select Section</option>
                {sectionsLookup.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {getBestLabel(s.sectionName, s.name, s.label)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Student" required>
              <select
                className="form-select avm-input ps-44"
                value={form.studentId}
                onChange={(e) => handleChange("studentId", e.target.value)}
                disabled={
                  fixedStudentId || editingId || form.sectionId === "Select"
                }
              >
                <option value="Select">Select Student</option>
                {studentsLookup.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name || s.fullName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assignment" required>
              <select
                className="form-select avm-input ps-44"
                value={form.assignmentId}
                onChange={(e) => handleChange("assignmentId", e.target.value)}
                disabled={
                  editingId || (form.studentId === "Select" && !fixedStudentId)
                }
              >
                <option value="Select">Select Assignment</option>
                {assignments.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.title}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Submission" required={!editingId} full noIcon>
            <div className="d-flex align-items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_DOC_TYPES}
                className="form-control"
                onChange={handleFileChange}
              />
              {selectedFileName ? (
                <>
                  <span className="text-muted small">{selectedFileName}</span>
                  {filePreviewUrl ? (
                    <button
                      type="button"
                      className="btn btn-light border btn-sm d-flex align-items-center gap-6"
                      onClick={handleViewFile}
                    >
                      <i className="ri-eye-line"></i> View
                    </button>
                  ) : null}
                </>
              ) : (
                <span className="text-muted small">{ACCEPTED_DOC_LABEL}</span>
              )}
            </div>
          </FormField>

          <FormField label="Note">
            <textarea
              className="form-control avm-input ps-44"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              rows={3}
              placeholder="Optional note"
            />
          </FormField>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? "Edit" : "Add"} Submission
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light">
              {" "}
              / Submission / {editingId ? "Edit" : "Add"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("submission")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          <div
            style={{
              borderBottom: "2px solid var(--primary-600, #4f46e5)",
              color: "var(--primary-600, #4f46e5)",
              fontWeight: 600,
              padding: "14px 20px",
              fontSize: "0.875rem",
            }}
          >
            {STEPS[0]}
          </div>
        </div>

        <div className="card-body p-24">
          {error && <div className="alert alert-danger mb-24">{error}</div>}
          {success && (
            <div className="alert alert-success mb-24">
              Submission {editingId ? "updated" : "saved"} successfully!
            </div>
          )}

          <div className="tab-content">{renderStep()}</div>

          <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
            <button
              type="button"
              className="btn btn-light border px-24"
              onClick={() => onNavigate?.("submission")}
            >
              Cancel
            </button>
            {activeStep > 0 && (
              <button
                type="button"
                className="btn btn-light border px-24"
                onClick={() => setActiveStep(0)}
              >
                Previous
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary-600 px-24"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Processing..." : "Save Submission"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSubmission;
