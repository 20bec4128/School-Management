import { useEffect, useMemo, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchStudentsByClassSection } from "../apis/studentsApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import "../assets/css/addModalShared.css";
import {
  fetchResultSmsById,
  createResultSms,
  updateResultSms,
} from "../apis/resultSmsApi";

const FIELD_ICONS = {
  "Head Office": "ri-building-line",
  "School Name": "ri-school-line",
  "Exam Term": "ri-calendar-event-line",
  "Receiver Type": "ri-group-line",
  Receiver: "ri-user-3-line",
  Template: "ri-file-list-3-line",
  Subject: "ri-edit-line",
  SMS: "ri-message-2-line",
};

const TEMPLATE_OPTIONS = {
  'Result Alert Template': {
    sms: 'Dear [name], your result for [exam] is [exam_result]. Total: [total_obtain]/[total_mark], Grade: [letter_grade]',
  },
  'Parent Notification Template': {
    sms: 'Dear Parent, your child [student_name] scored [total_obtain]/[total_mark] in [exam]. Grade: [letter_grade]',
  },
  'Student Result Template': {
    sms: 'Hello [name], your exam result: [exam] - [exam_result]. Percentage: [percentage]%',
  },
};

const DYNAMIC_TAGS = [
  '[name]',
  '[student_name]',
  '[exam]',
  '[exam_result]',
  '[total_obtain]',
  '[total_mark]',
  '[percentage]',
  '[letter_grade]',
  '[school]',
];

const DEFAULT_EXAM_TERMS = ['First Term', 'Second Term', 'Final Term'];
const RECEIVER_TYPE_OPTIONS = ['Student', 'Parent', 'Guardian'];

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

const ResultSmsCreate = ({ onNavigate }) => {
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
    () => sessionStorage.getItem("RESULT_SMS_EDIT_ID"),
    [],
  );
  const isEditMode = Boolean(editId);

  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [form, setForm] = useState({
    headOfficeId: "",
    schoolId: "",
    examTerm: "",
    receiverType: "",
    receiver: "",
    template: "",
    subject: "",
    smsBody: "",
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
      try {
        const lookupData = await fetchSchoolsLookup();
        setSchools(Array.isArray(lookupData) ? lookupData : []);

        if (isEditMode && editId) {
          const existing = await fetchResultSmsById(editId);
          if (existing) {
            setForm({
              headOfficeId:
                existing.headOfficeId != null
                  ? String(existing.headOfficeId)
                  : "",
              schoolId:
                existing.schoolId != null ? String(existing.schoolId) : "",
              examTerm: existing.examTerm || "",
              receiverType: existing.receiverType || "",
              receiver: existing.receiver || "",
              template: existing.template || "",
              subject: existing.subject || "",
              smsBody: existing.smsBody || "",
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
    };
    void loadFormAndSchools();
  }, [isEditMode, editId]);

  useEffect(() => {
    if (!isSchoolAdmin || authSchoolId == null) return;
    setForm((prev) => ({ ...prev, schoolId: String(authSchoolId) }));
  }, [authSchoolId, isSchoolAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || isEditMode || !manualScope.selectedSchoolId) return;
    setForm((prev) => ({
      ...prev,
      schoolId: String(manualScope.selectedSchoolId),
    }));
  }, [isSuperAdmin, isEditMode, manualScope.selectedSchoolId]);

  useEffect(() => {
    if (!form.schoolId) {
      setStudents([]);
      return;
    }
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const data = await fetchStudentsByClassSection({ schoolId: form.schoolId });
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    void loadStudents();
  }, [form.schoolId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => {
      if (id === "receiverType") {
        return {
          ...prev,
          receiverType: value,
          receiver: "",
        };
      }
      if (id === "template") {
        const selected = TEMPLATE_OPTIONS[value];
        return {
          ...prev,
          template: value,
          smsBody: selected ? selected.sms : prev.smsBody,
        };
      }
      return { ...prev, [id]: value };
    });
  };

  const handleHeadOfficeChange = (value) => {
    manualScope.setSelectedScope(value, "");
    setForm((prev) => ({ ...prev, headOfficeId: value, schoolId: "", receiver: "" }));
  };

  const handleSchoolChange = (value) => {
    setForm((prev) => ({ ...prev, schoolId: value, receiver: "" }));
    if (isSuperAdmin) {
      manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value);
    }
  };

  const validate = () => {
    if (!form.schoolId) return "School is required";
    if (!form.examTerm) return "Exam Term is required";
    if (!form.receiverType) return "Receiver Type is required";
    if (!form.receiver) return "Receiver is required";
    if (!form.subject.trim()) return "Subject is required";
    if (!form.smsBody.trim()) return "SMS Body is required";
    return "";
  };

  const validateStep = (targetStep) => {
    if (targetStep === 0) {
      if (!form.schoolId) return "School is required";
      if (!form.examTerm) return "Exam Term is required";
      if (!form.receiverType) return "Receiver Type is required";
      if (!form.receiver) return "Receiver is required";
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
      examTerm: form.examTerm,
      receiverType: form.receiverType,
      receiver: form.receiver,
      template: form.template,
      subject: form.subject.trim(),
      smsBody: form.smsBody.trim(),
    };

    try {
      if (isEditMode) {
        await updateResultSms(editId, payload);
      } else {
        await createResultSms(payload);
      }

      setSuccessMessage(
        `Result SMS engine ${isEditMode ? "updated" : "dispatched"} successfully! Redirecting...`,
      );
      setSuccess(true);
      sessionStorage.removeItem("RESULT_SMS_EDIT_ID");
      setTimeout(() => onNavigate?.("result-sms"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to submit backend request endpoint.");
    } finally {
      setSaving(false);
    }
  };

  const receiverOptions = useMemo(() => {
    if (!form.receiverType) return [];
    return students.map((s) => {
      if (form.receiverType === "Student") return s.name;
      if (form.receiverType === "Parent") return s.fatherName || `Parent of ${s.name}`;
      return s.relationWithGuardian || `Guardian of ${s.name}`;
    }).filter(Boolean);
  }, [students, form.receiverType]);

  const remainingCharacters = 160 - form.smsBody.length;

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? "Edit Result SMS" : "Send Result SMS"}
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
              / Result SMS / {isEditMode ? "Edit" : "Send"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("result-sms")}
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
          {["Basic Information", "SMS Content"].map((tab, index) => (
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
                  <FormField label="School Name" required full>
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

                <FormField label="Exam Term" required full>
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

                <FormField label="Receiver" required>
                  <select
                    className="form-control form-select ps-40"
                    id="receiver"
                    value={form.receiver}
                    onChange={handleChange}
                    disabled={!form.receiverType || loadingStudents}
                  >
                    <option value="">
                      {loadingStudents ? "Loading..." : "--Select--"}
                    </option>
                    {receiverOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </FormField>
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

                <FormField label="SMS" required full noIcon>
                  <textarea
                    rows={6}
                    className="form-control"
                    id="smsBody"
                    placeholder="SMS Body"
                    value={form.smsBody}
                    onChange={handleChange}
                    style={{ borderRadius: "8px" }}
                  />
                </FormField>

                <div className="avm-field full">
                  <span
                    style={{
                      fontSize: '0.82rem',
                      color: remainingCharacters < 0 ? '#dc3545' : '#667085',
                    }}
                  >
                    You have remain character/letter : {remainingCharacters}
                  </span>
                </div>

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
                                smsBody: prev.smsBody
                                  ? `${prev.smsBody} ${tag}`
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
                  onClick={() => onNavigate?.("result-sms")}
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

export default ResultSmsCreate;
