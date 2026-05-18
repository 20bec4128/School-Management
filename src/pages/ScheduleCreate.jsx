import { useEffect, useMemo, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSubjects } from "../apis/subjectsApi";
import {
  createSchedule,
  fetchScheduleById,
  updateSchedule,
} from "../apis/scheduleApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";

const DEFAULT_EXAM_TERMS = ["First Term", "Second Term", "Final Term"];

const emptyForm = {
  id: null,
  schoolId: "",
  examTerm: "",
  class: "",
  subject: "",
  examDate: "",
  startTime: "",
  endTime: "",
  roomNo: "",
  note: "",
};

const FIELD_ICONS = {
  "Head Office": "ri-building-line",
  "School Name": "ri-school-line",
  "Exam Term": "ri-calendar-event-line",
  Class: "ri-graduation-cap-line",
  Subject: "ri-book-open-line",
  "Exam Date": "ri-calendar-2-line",
  "Start Time": "ri-time-line",
  "End Time": "ri-time-line",
  "Room No": "ri-door-open-line",
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
        children
      )}
    </div>
  );
};

const uniqueStrings = (items) =>
  Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => String(item ?? "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

const extractClassName = (item) =>
  String(
    item?.className ?? item?.name ?? item?.numericName ?? item?.title ?? "",
  ).trim();

const extractSubjectName = (item) =>
  String(
    item?.subjectName ?? item?.name ?? item?.subject ?? item?.title ?? "",
  ).trim();

const normalizeTimeInput = (value) => {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";

  const directMatch = text.match(/^(\d{1,2}):(\d{2})$/);
  if (directMatch) {
    return `${String(Number(directMatch[1])).padStart(2, "0")}:${directMatch[2]}`;
  }

  const twentyFourHourMatch = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHourMatch) {
    return `${String(Number(twentyFourHourMatch[1])).padStart(2, "0")}:${twentyFourHourMatch[2]}`;
  }

  const twelveHourMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!twelveHourMatch) return "";

  let hour = Number(twelveHourMatch[1]);
  const minute = twelveHourMatch[2];
  const meridiem = twelveHourMatch[3].toUpperCase();
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
};

const ScheduleCreate = ({ onNavigate }) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();
  const role = useMemo(
    () =>
      normalizeRole(
        authRole || user?.role || user?.userRole || user?.authority,
      ),
    [authRole, user],
  );
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isHeadOfficeAdmin = role === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);
  const [editingId, setEditingId] = useState("");

  const [schools, setSchools] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    const list = Array.isArray(schools) ? schools : [];
    if (isHeadOfficeAdmin) {
      return list.filter(
        (school) =>
          String(school?.headOfficeId ?? "") === String(authHeadOfficeId),
      );
    }
    if (isSchoolAdmin) {
      return list.length > 0
        ? list
        : authSchoolId != null
          ? [
              {
                id: authSchoolId,
                schoolName: authSchoolName || "My School",
                headOfficeId: null,
              },
            ]
          : [];
    }
    return list;
  }, [
    schools,
    isSuperAdmin,
    manualScope.schoolOptions,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    authHeadOfficeId,
    authSchoolId,
    authSchoolName,
  ]);

  const examTermOptions = DEFAULT_EXAM_TERMS;
  const isEditMode = Boolean(editingId);
  const pageTitle = isEditMode ? "Edit Schedule" : "Add Schedule";
  const submitLabel = saving
    ? "Saving..."
    : isEditMode
      ? "Update Schedule"
      : "Save Schedule";

  useEffect(() => {
    const storedId = sessionStorage.getItem("sm_schedule_edit_id") || "";
    setEditingId(storedId);
  }, []);

  useEffect(() => {
    if (status !== "ready" || !token || isSuperAdmin) return;
    let cancelled = false;

    const loadLookups = async () => {
      try {
        if (isSchoolAdmin) {
          const singleSchool =
            authSchoolId != null
              ? [
                  {
                    id: Number(authSchoolId),
                    schoolName: authSchoolName || "My School",
                    headOfficeId: null,
                  },
                ]
              : [];
          if (!cancelled) setSchools(singleSchool);
          return;
        }

        const allSchools = await fetchSchoolsLookup();
        const accessibleSchools = isHeadOfficeAdmin
          ? allSchools.filter(
              (school) =>
                String(school?.headOfficeId ?? "") === String(authHeadOfficeId),
            )
          : allSchools;
        if (!cancelled) setSchools(accessibleSchools);
      } catch (err) {
        console.error("Failed to load schedule schools:", err);
        if (!cancelled) setSchools([]);
      }
    };

    void loadLookups();
    return () => {
      cancelled = true;
    };
  }, [
    status,
    token,
    isSuperAdmin,
    isSchoolAdmin,
    isHeadOfficeAdmin,
    authHeadOfficeId,
    authSchoolId,
    authSchoolName,
  ]);

  useEffect(() => {
    if (status !== "ready" || !token || !editingId) return;

    let cancelled = false;
    const loadEditingSchedule = async () => {
      try {
        const schedule = await fetchScheduleById(editingId);
        if (cancelled || !schedule) return;
        setForm({
          id: schedule.id ?? null,
          schoolId: schedule.schoolId != null ? String(schedule.schoolId) : "",
          examTerm: schedule.examTerm ?? "",
          class: schedule.className ?? "",
          subject: schedule.subjectName ?? "",
          examDate: schedule.examDate ?? "",
          startTime: schedule.startTime ?? "",
          endTime: schedule.endTime ?? "",
          roomNo: schedule.roomNo ?? "",
          note: schedule.note ?? "",
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load schedule for editing:", err);
          setError(err?.message || "Failed to load schedule for editing");
        }
      }
    };

    void loadEditingSchedule();
    return () => {
      cancelled = true;
    };
  }, [status, token, editingId]);

  useEffect(() => {
    const selectedSchoolId = form.schoolId;
    if (!selectedSchoolId) {
      setClassOptions([]);
      setSubjectOptions([]);
      return;
    }

    let cancelled = false;
    const loadDependentLookups = async () => {
      try {
        const [classesData, subjectsData] = await Promise.all([
          fetchClasses({ schoolId: selectedSchoolId }).catch(() => []),
          fetchSubjects({ schoolId: selectedSchoolId }).catch(() => []),
        ]);
        if (cancelled) return;
        setClassOptions(
          uniqueStrings(
            (Array.isArray(classesData) ? classesData : []).map(
              extractClassName,
            ),
          ),
        );
        setSubjectOptions(
          uniqueStrings(
            (Array.isArray(subjectsData) ? subjectsData : []).map(
              extractSubjectName,
            ),
          ),
        );
      } catch (err) {
        console.error("Failed to load schedule lookups:", err);
        if (!cancelled) {
          setClassOptions([]);
          setSubjectOptions([]);
        }
      }
    };

    void loadDependentLookups();
    return () => {
      cancelled = true;
    };
  }, [form.schoolId]);

  useEffect(() => {
    if (!isSuperAdmin || editingId) return;
    setForm((prev) => ({
      ...prev,
      schoolId: manualScope.selectedSchoolId
        ? String(manualScope.selectedSchoolId)
        : "",
    }));
  }, [isSuperAdmin, manualScope.selectedSchoolId]);

  useEffect(() => {
    if (!isSuperAdmin || !editingId || !form.schoolId) return;
    const match = Array.isArray(manualScope.schoolOptions)
      ? manualScope.schoolOptions.find(
          (school) => String(school?.id ?? "") === String(form.schoolId),
        )
      : null;
    if (!match) return;
    const headOfficeId =
      match?.headOfficeId != null ? String(match.headOfficeId) : "";
    manualScope.setSelectedScope(headOfficeId, String(form.schoolId));
  }, [isSuperAdmin, editingId, form.schoolId, manualScope]);

  useEffect(() => {
    if (!isSchoolAdmin) return;
    if (authSchoolId == null) return;
    setForm((prev) => ({
      ...prev,
      schoolId: String(authSchoolId),
    }));
  }, [authSchoolId, isSchoolAdmin]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleHeadOfficeChange = (e) => {
    const value = e.target.value;
    manualScope.setSelectedScope(value, "");
    setForm((prev) => ({
      ...prev,
      schoolId: "",
    }));
  };

  const handleSchoolChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      schoolId: value,
    }));
    if (isSuperAdmin) {
      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value);
    }
  };

  const clearEditState = () => {
    sessionStorage.removeItem("sm_schedule_edit_id");
    setEditingId("");
    setForm(emptyForm);
  };

  const validateForm = () => {
    if (!form.schoolId) return "School is required";
    if (!form.examTerm) return "Exam Term is required";
    if (!form.class) return "Class is required";
    if (!form.subject) return "Subject is required";
    if (!form.examDate) return "Exam Date is required";
    if (!form.startTime) return "Start Time is required";
    if (!form.endTime) return "End Time is required";
    if (!form.roomNo) return "Room No is required";

    const start = normalizeTimeInput(form.startTime);
    const end = normalizeTimeInput(form.endTime);
    if (!start) return "Start Time is invalid";
    if (!end) return "End Time is invalid";
    if (start > end) return "Start Time cannot be greater than End Time";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);
    setSuccessMessage("");
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        examTerm: String(form.examTerm || "").trim(),
        className: String(form.class || "").trim(),
        subjectName: String(form.subject || "").trim(),
        examDate: form.examDate,
        startTime: normalizeTimeInput(form.startTime),
        endTime: normalizeTimeInput(form.endTime),
        roomNo: String(form.roomNo || "").trim(),
        note: form.note?.trim() || null,
      };

      if (isEditMode) {
        await updateSchedule(editingId, payload);
        setSuccessMessage("Schedule updated successfully! Redirecting...");
      } else {
        await createSchedule(payload);
        setSuccessMessage("Schedule created successfully! Redirecting...");
      }
      setSuccess(true);
      clearEditState();
      setTimeout(() => onNavigate?.("schedule"), 1000);
    } catch (err) {
      console.error("Failed to create schedule:", err);
      setError(err?.message || "Failed to create schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {pageTitle}
          </h1>
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
              onClick={() => onNavigate?.("schedule")}
            >
              Schedule
            </button>{" "}
            / {isEditMode ? "Edit" : "Add"}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-2"
          onClick={() => onNavigate?.("schedule")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {success ? (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-checkbox-circle-line text-lg" />
          {successMessage || "Schedule saved successfully! Redirecting..."}
        </div>
      ) : null}

      <div className="card">
        <div className="card-body p-24">
          {error ? (
            <div className="alert alert-danger mb-24">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="avm-grid">
              {isSuperAdmin ? (
                <FormField label="Head Office" required>
                  <select
                    className="avm-select"
                    id="headOfficeId"
                    value={manualScope.selectedHeadOfficeId}
                    onChange={handleHeadOfficeChange}
                  >
                    <option value="">--Select Head Office--</option>
                    {manualScope.headOffices.map((headOffice) => (
                      <option key={headOffice.id} value={String(headOffice.id)}>
                        {headOffice.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}

              <FormField label="School Name" required>
                <select
                  className="avm-select"
                  id="schoolId"
                  value={form.schoolId}
                  onChange={handleSchoolChange}
                >
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={school.id} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Exam Term" required>
                <select
                  className="avm-select"
                  id="examTerm"
                  value={form.examTerm}
                  onChange={handleChange}
                >
                  <option value="">--Select--</option>
                  {examTermOptions.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="class"
                  value={form.class}
                  onChange={handleChange}
                >
                  <option value="">--Select--</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Subject" required>
                <select
                  className="avm-select"
                  id="subject"
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option value="">--Select--</option>
                  {subjectOptions.map((subjectName) => (
                    <option key={subjectName} value={subjectName}>
                      {subjectName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Exam Date" required>
                <input
                  type="date"
                  className="avm-input"
                  id="examDate"
                  value={form.examDate}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Start Time" required>
                <input
                  type="time"
                  className="avm-input"
                  id="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="End Time" required>
                <input
                  type="time"
                  className="avm-input"
                  id="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Room No" required>
                <input
                  type="text"
                  className="avm-input"
                  id="roomNo"
                  placeholder="Room No"
                  value={form.roomNo}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Note" full noIcon>
                <textarea
                  rows={4}
                  className="avm-input avm-textarea"
                  id="note"
                  placeholder="Note"
                  value={form.note}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => {
                  clearEditState();
                  onNavigate?.("schedule");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32"
                disabled={saving}
              >
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCreate;
