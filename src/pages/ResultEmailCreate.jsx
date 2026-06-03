import { useEffect, useMemo, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchStudentsByClassSection } from "../apis/studentsApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import "../assets/css/addModalShared.css";
import {
  fetchResultEmailById,
  createResultEmail,
  updateResultEmail,
} from "../apis/resultEmailApi";

const FIELD_ICONS = {
  "Head Office": "ri-building-line",
  "School Name": "ri-school-line",
  Exam: "ri-file-list-3-line",
  "Receiver Type": "ri-group-line",
  Receiver: "ri-user-3-line",
  Template: "ri-file-list-3-line",
  Subject: "ri-mail-open-line",
  "Email Body": "ri-mail-send-line",
};

const TEMPLATE_OPTIONS = {
  "Result Template": {
    subject: "Exam Result - {exam_name}",
    emailBody:
      "Dear {receiver_name},\n\nYour exam result for {exam_name} has been published.\n\nTotal Marks: {total_marks}\nObtained Marks: {obtained_marks}\nPercentage: {percentage}%\nGrade: {grade}\n\nRegards,\n{school_name}",
  },
  "Parent Notification Template": {
    subject: "Your Child Result - {student_name}",
    emailBody:
      "Dear Parent/Guardian,\n\nThe result of {student_name} for {exam_name} is as follows:\n\nTotal Marks: {total_marks}\nObtained Marks: {obtained_marks}\nPercentage: {percentage}%\nGrade: {grade}\n\nRegards,\n{school_name}",
  },
  "Grade Alert Template": {
    subject: "Grade Published - {exam_name}",
    emailBody:
      "Hello {receiver_name},\n\nThe grades for {exam_name} examination have been published.\n\nYour Grade: {grade}\nPercentage: {percentage}%\n\nThank you,\n{school_name}",
  },
};

const DYNAMIC_TAGS = [
  "{school_name}",
  "{receiver_name}",
  "{student_name}",
  "{exam_name}",
  "{total_marks}",
  "{obtained_marks}",
  "{percentage}",
  "{grade}",
];

const DEFAULT_EXAM_TERMS = ["First Term", "Second Term", "Final Term"];
const RECEIVER_TYPE_OPTIONS = ["Student", "Parent", "Guardian"];

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

const ResultEmailCreate = ({ onNavigate }) => {
  const {
    role: authRole,
    user,
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

  const editId = useMemo(
    () => sessionStorage.getItem("RESULT_EMAIL_EDIT_ID"),
    [],
  );
  const isEditMode = Boolean(editId);

  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [form, setForm] = useState({
    headOfficeId: "",
    schoolId: "",
    classId: "",
    examTerm: "",
    receiverType: "",
    receivers: [],
    template: "",
    subject: "",
    emailBody: "",
  });

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const schoolOptions = useMemo(() => {
    const list = Array.isArray(schools) ? schools : [];
    if (isSuperAdmin) return manualScope.schoolOptions || [];
    if (isHeadOfficeAdmin) {
      return list.filter(
        (school) =>
          String(school?.headOfficeId ?? "") === String(authHeadOfficeId ?? ""),
      );
    }
    if (isSchoolAdmin) {
      const match = list.find(
        (school) => String(school?.id ?? "") === String(authSchoolId ?? ""),
      );
      if (match) return [match];
      if (authSchoolId != null) {
        return [
          {
            id: authSchoolId,
            schoolName: authSchoolName || "My School",
            headOfficeId: authHeadOfficeId ?? null,
          },
        ];
      }
      return [];
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

  useEffect(() => {
    const loadFormAndSchools = async () => {
      if (isSchoolAdmin) {
        setSchools(
          authSchoolId != null
            ? [
                {
                  id: authSchoolId,
                  schoolName: authSchoolName || "My School",
                  headOfficeId: authHeadOfficeId ?? null,
                },
              ]
            : [],
        );
      } else {
      try {
        const lookupData = await fetchSchoolsLookup();
        setSchools(Array.isArray(lookupData) ? lookupData : []);

        if (isEditMode && editId) {
          const existing = await fetchResultEmailById(editId);
          if (existing) {
            setForm({
              headOfficeId:
                existing.headOfficeId != null
                  ? String(existing.headOfficeId)
                  : "",
              schoolId:
                existing.schoolId != null ? String(existing.schoolId) : "",
              classId: existing.classId != null ? String(existing.classId) : "",
              examTerm: existing.examTerm || "",
              receiverType: existing.receiverType || "",
              receivers: existing.receiver ? [existing.receiver] : [],
              template: existing.template || "",
              subject: existing.subject || "",
              emailBody: existing.emailBody || "",
            });
            if (isSuperAdmin && existing.schoolId) {
              const match = lookupData.find(
                (s) => String(s.id) === String(existing.schoolId),
              );
              manualScope.setSelectedScope(
                match?.headOfficeId != null ? String(match.headOfficeId) : "",
                String(existing.schoolId),
              );
            }
          }
        }
      } catch (err) {
        setError("Error loading record configuration dependencies.");
      }
      }
    };
    void loadFormAndSchools();
  }, [authHeadOfficeId, authSchoolId, authSchoolName, editId, isEditMode, isSchoolAdmin, isSuperAdmin, manualScope.setSelectedScope]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!form.schoolId || !form.classId) {
        setStudents([]);
        return;
      }

      setLoadingStudents(true);
      try {
        const data = await fetchStudentsByClassSection({
          schoolId: form.schoolId,
          classId: form.classId,
        });
        setStudents(Array.isArray(data) ? data : []);
      } catch {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    void loadStudents();
  }, [form.schoolId, form.classId]);

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return;
    setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }));
  }, [authSchoolId, isSchoolAdmin]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!form.schoolId) {
        setClasses([]);
        return;
      }

      try {
        const data = await fetchClasses({ schoolId: form.schoolId });
        setClasses(Array.isArray(data) ? data : []);
      } catch {
        setClasses([]);
      }
    };

    void loadClasses();
  }, [form.schoolId]);

  useEffect(() => {
    if (!isSuperAdmin || isEditMode || !manualScope.selectedSchoolId) return;
    setForm((prev) => ({
      ...prev,
      schoolId: String(manualScope.selectedSchoolId),
    }));
  }, [isSuperAdmin, isEditMode, manualScope.selectedSchoolId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => {
      if (id === "receiverType") {
        return {
          ...prev,
          receiverType: value,
          receivers: [],
        };
      }
      if (id === "classId") {
        return {
          ...prev,
          classId: value,
          receivers: [],
        };
      }
      if (id === "template") {
        const selected = TEMPLATE_OPTIONS[value];
        return {
          ...prev,
          template: value,
          subject: selected ? selected.subject : prev.subject,
          emailBody: selected ? selected.emailBody : prev.emailBody,
        };
      }
      return { ...prev, [id]: value };
    });
  };

  const buildReceiverLabel = (student, receiverType) => {
    const name =
      student?.name ||
      student?.studentName ||
      student?.fullName ||
      "Unnamed Student";
    const rollNo = student?.rollNo ? ` • Roll No: ${student.rollNo}` : "";
    const className = student?.className
      ? ` • Class: ${student.className}`
      : "";
    const section = student?.section ? ` • Section: ${student.section}` : "";
    const email = student?.email ? ` • ${student.email}` : "";

    if (receiverType === "Parent") {
      return `${name}${rollNo}${className}${section}${email}`;
    }

    if (receiverType === "Guardian") {
      return `${name}${rollNo}${className}${section}${email}`;
    }

    return `${name}${rollNo}${className}${section}${email}`;
  };

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedScope(value, "");
    setForm((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: "",
      classId: "",
      receivers: [],
    }));
  };

  const handleSchoolChange = (value) => {
    setForm((prev) => ({
      ...prev,
      schoolId: value,
      classId: "",
      receivers: [],
    }));
    if (isSuperAdmin) {
      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value);
    }
  };

  const validate = () => {
    if (!form.schoolId) return "School is required";
    if (!form.classId) return "Class is required";
    if (!form.examTerm) return "Exam Term is required";
    if (!form.receiverType) return "Receiver Type is required";
    if (!form.receivers.length) return "At least one student must be selected";
    if (!form.subject.trim()) return "Subject is required";
    if (!form.emailBody.trim()) return "Email Body is required";
    return "";
  };

  const validateStep = (targetStep) => {
    if (targetStep === 0) {
      if (!form.schoolId) return "School is required";
      if (!form.classId) return "Class is required";
      if (!form.examTerm) return "Exam Term is required";
      if (!form.receiverType) return "Receiver Type is required";
      if (!form.receivers.length)
        return "At least one student must be selected";
    }
    return "";
  };

  const resolveSchoolName = () => {
    const match = schoolOptions.find(
      (s) => String(s.id) === String(form.schoolId),
    );
    return match ? match.schoolName : "Selected School";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    const selectedSchool = schoolOptions.find(
      (s) => String(s.id) === String(form.schoolId),
    );
    const resolvedHeadOfficeId =
      selectedSchool?.headOfficeId != null
        ? Number(selectedSchool.headOfficeId)
        : form.headOfficeId
          ? Number(form.headOfficeId)
          : authHeadOfficeId
            ? Number(authHeadOfficeId)
            : null;

    const payload = {
      headOfficeId: resolvedHeadOfficeId,
      schoolId: Number(form.schoolId),
      schoolName: resolveSchoolName(),
      classId: form.classId ? Number(form.classId) : null,
      examTerm: form.examTerm,
      receiverType: form.receiverType,
      receiver: form.receivers[0] || "",
      receivers: form.receivers,
      template: form.template,
      subject: form.subject.trim(),
      emailBody: form.emailBody.trim(),
    };

    try {
      if (isEditMode) {
        await updateResultEmail(editId, payload);
      } else {
        await createResultEmail(payload);
      }

      setSuccessMessage(
        `Result Email engine ${isEditMode ? "updated" : "dispatched"} successfully! Redirecting...`,
      );
      setSuccess(true);
      sessionStorage.removeItem("RESULT_EMAIL_EDIT_ID");
      setTimeout(() => onNavigate?.("result-email"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to submit backend request endpoint.");
    } finally {
      setSaving(false);
    }
  };

  const receiverOptions = useMemo(() => {
    if (!form.receiverType || !form.schoolId || !form.classId) return [];
    const studentList = Array.isArray(students) ? students : [];

    return studentList
      .map((student) => {
        const value = student?.email?.trim() || "";

        if (!value) return null;

        return {
          value,
          label: buildReceiverLabel(student, form.receiverType),
        };
      })
      .filter(Boolean);
  }, [form.receiverType, form.schoolId, form.classId, students]);

  const handleReceiverToggle = (value) => {
    setForm((prev) => {
      const exists = prev.receivers.includes(value);
      return {
        ...prev,
        receivers: exists
          ? prev.receivers.filter((item) => item !== value)
          : [...prev.receivers, value],
      };
    });
  };

  const selectAllReceivers = () => {
    setForm((prev) => ({
      ...prev,
      receivers: receiverOptions.map((item) => item.value),
    }));
  };

  const clearReceivers = () => {
    setForm((prev) => ({ ...prev, receivers: [] }));
  };
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? "Edit Result Email" : "Send Result Email"}
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
              / Result Email / {isEditMode ? "Edit" : "Send"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("result-email")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-24 radius-8">{error}</div>
      )}
      {success && (
        <div className="alert alert-success mb-24 radius-8">
          {successMessage}
        </div>
      )}

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0">
          {["Basic Information", "Email Content"].map((tab, index) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (index > step) {
                  const validation = validateStep(step);
                  if (validation) {
                    setError(validation);
                    return;
                  }
                }
                setError("");
                setStep(index);
              }}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  step === index
                    ? "2px solid var(--primary-600, #4f46e5)"
                    : "2px solid transparent",
                color:
                  step === index
                    ? "var(--primary-600, #4f46e5)"
                    : "var(--secondary-light, #667085)",
                fontWeight: step === index ? 600 : 400,
                padding: "14px 20px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body p-24">
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 0 ? (
              <div className="avm-grid">
                {isSuperAdmin ? (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <ManualScopeSelectors
                      enabled={isSuperAdmin}
                      headOffices={manualScope.headOffices}
                      schoolOptions={schoolOptions}
                      selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                      onHeadOfficeChange={handleHeadOfficeChange}
                      selectedSchoolId={form.schoolId}
                      onSchoolChange={handleSchoolChange}
                      compact
                    />
                  </div>
                ) : (
                  <FormField label="School Name" required>
                    <select
                      className="form-control form-select ps-40"
                      id="schoolId"
                      value={form.schoolId}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      disabled={isSchoolAdmin}
                    >
                      <option value="">--Select School--</option>
                      {schoolOptions.map((school) => (
                        <option
                          key={String(school.id)}
                          value={String(school.id)}
                        >
                          {school.schoolName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField label="Class" required>
                  <select
                    className="form-control form-select ps-40"
                    id="classId"
                    value={form.classId}
                    onChange={handleChange}
                    disabled={!form.schoolId}
                  >
                    <option value="">
                      {form.schoolId
                        ? "--Select Class--"
                        : "Select School First"}
                    </option>
                    {classes.map((option) => (
                      <option key={String(option.id)} value={String(option.id)}>
                        {option.className || option.name || String(option.id)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Exam" required>
                  <select
                    className="form-control form-select ps-40"
                    id="examTerm"
                    value={form.examTerm}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {DEFAULT_EXAM_TERMS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Receiver Type" required>
                  <select
                    className="form-control form-select ps-40"
                    id="receiverType"
                    value={form.receiverType}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {RECEIVER_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="avm-field full">
                  <label className="avm-label">
                    Students
                    <span className="req"> *</span>
                  </label>
                  <div
                    style={{
                      border: "1px solid #d0d5dd",
                      borderRadius: "0.9rem",
                      padding: "0.9rem",
                      background: !form.classId ? "#f8fafc" : "#fff",
                    }}
                  >
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-12">
                      <div
                        className="text-secondary-light"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {loadingStudents
                          ? "Loading students..."
                          : form.classId
                            ? `${form.receivers.length} selected`
                            : "Select a school and class to load students"}
                      </div>
                      <div className="d-flex gap-8">
                        <button
                          type="button"
                          className="btn btn-light border btn-sm"
                          onClick={selectAllReceivers}
                          disabled={!receiverOptions.length}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="btn btn-light border btn-sm"
                          onClick={clearReceivers}
                          disabled={!form.receivers.length}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {form.classId ? (
                      <div
                        style={{
                          maxHeight: "280px",
                          overflowY: "auto",
                          display: "grid",
                          gap: "0.6rem",
                        }}
                      >
                        {receiverOptions.length ? (
                          receiverOptions.map((item) => (
                            <label
                              key={item.value}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.75rem",
                                padding: "0.75rem 0.85rem",
                                border: "1px solid #eaecf0",
                                borderRadius: "0.75rem",
                                cursor: "pointer",
                                background: form.receivers.includes(item.value)
                                  ? "#f5f3ff"
                                  : "#fff",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={form.receivers.includes(item.value)}
                                onChange={() =>
                                  handleReceiverToggle(item.value)
                                }
                                style={{ marginTop: "0.2rem" }}
                              />
                              <span style={{ lineHeight: 1.45 }}>
                                {item.label}
                              </span>
                            </label>
                          ))
                        ) : (
                          <div className="text-secondary-light">
                            No student emails found in this class.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-secondary-light">
                        Select a school and class first.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="avm-grid">
                <FormField label="Template" full>
                  <select
                    className="form-control form-select ps-40"
                    id="template"
                    value={form.template}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {Object.keys(TEMPLATE_OPTIONS).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Subject" required full>
                  <input
                    type="text"
                    className="form-control ps-40"
                    id="subject"
                    placeholder="Subject"
                    value={form.subject}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Email Body" required full noIcon>
                  <textarea
                    rows={6}
                    className="form-control"
                    id="emailBody"
                    placeholder="Email Body"
                    value={form.emailBody}
                    onChange={handleChange}
                    style={{ borderRadius: "8px" }}
                  />
                </FormField>

                <div className="avm-field full">
                  <label className="avm-label">Dynamic Tag</label>
                  <div
                    style={{
                      border: "1px solid #d0d5dd",
                      borderRadius: "0.9rem",
                      padding: "0.9rem",
                      background: "#f8fafc",
                    }}
                  >
                    <div className="avm-chip-wrap" style={{ marginTop: 0 }}>
                      {DYNAMIC_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="avm-chip"
                          style={{ border: "none", cursor: "pointer" }}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              emailBody: prev.emailBody
                                ? `${prev.emailBody} ${tag}`
                                : tag,
                            }))
                          }
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-24">
              <div>
                {step > 0 && (
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="d-flex gap-10">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => onNavigate?.("result-email")}
                >
                  Cancel
                </button>
                {step === 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary-600"
                    disabled={saving}
                    onClick={handleSubmit}
                  >
                    {saving ? "Saving..." : isEditMode ? "Update" : "Send"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary-600"
                    onClick={() => {
                      const validation = validateStep(step);
                      if (validation) {
                        setError(validation);
                        return;
                      }
                      setError("");
                      setSuccess(false);
                      setSuccessMessage("");
                      setStep((prev) => Math.min(1, prev + 1));
                    }}
                  >
                    Next
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

export default ResultEmailCreate;
