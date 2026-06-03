import { useEffect, useMemo, useState } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchStudentsByClassSection } from "../apis/studentsApi";
import { fetchTeachers } from "../apis/teachersApi";
import {
  createEmail,
  fetchEmailById,
  updateEmail,
} from "../apis/emailApi";
import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { normalizeRole } from "../utils/roles";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { EMAIL_EDIT_STORAGE_KEY, EMAIL_RECEIVER_TYPE_OPTIONS } from "../constants/email";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Class: "ri-book-open-line",
  "Receiver Type": "ri-group-line",
  Receiver: "ri-user-search-line",
  Subject: "ri-mail-line",
  "Email Body": "ri-file-text-line",
};

const DEFAULT_FORM = {
  headOfficeId: "",
  schoolId: "",
  classId: "",
  receiverType: "",
  receiver: "",
  subject: "",
  emailBody: "",
};

const readEditId = () => {
  try {
    return sessionStorage.getItem(EMAIL_EDIT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const FormField = ({ label, required, children, full = false, noIcon = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label} {required && <span className="text-danger-600">*</span>}
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
              zIndex: 1,
              pointerEvents: "none",
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

const EmailCreate = ({ onNavigate }) => {
  const { role: authRole, user, schoolId: authSchoolId, schoolName: authSchoolName, headOfficeId: authHeadOfficeId } = useAuth();
  const role = useMemo(
    () => normalizeRole(authRole || user?.role || user?.userRole || user?.authority),
    [authRole, user],
  );
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);
  const currentSchoolOption = useMemo(() => {
    if (!isSchoolAdmin || authSchoolId == null) return null;
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    };
  }, [authHeadOfficeId, authSchoolId, authSchoolName, isSchoolAdmin]);

  const [editId] = useState(() => readEditId());
  const [editingRow, setEditingRow] = useState(null);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadSchools = async () => {
      if (isSchoolAdmin) {
        setSchools(currentSchoolOption ? [currentSchoolOption] : []);
        return;
      }
      try {
        const data = await fetchSchoolsLookup();
        setSchools(Array.isArray(data) ? data : []);
      } catch {
        setSchools([]);
      }
    };
    void loadSchools();
  }, [currentSchoolOption, isSchoolAdmin, isEditMode, editId, isSuperAdmin, manualScope.setSelectedScope]);

  useEffect(() => {
    const loadEdit = async () => {
      if (!editId) return;
      setLoadingEdit(true);
      try {
        const existing = await fetchEmailById(editId);
        if (!existing) return;
        setEditingRow(existing);
        setForm({
          headOfficeId: existing.headOfficeId != null ? String(existing.headOfficeId) : "",
          schoolId: existing.schoolId != null ? String(existing.schoolId) : "",
          classId: existing.className ? "" : "",
          receiverType: existing.receiverType || "",
          receiver: existing.receiver || "",
          subject: existing.subject || "",
          emailBody: existing.emailBody || "",
        });
      } catch (err) {
        setError(err?.message || "Failed to load email record.");
      } finally {
        setLoadingEdit(false);
      }
    };
    void loadEdit();
  }, [editId]);

  useEffect(() => {
    if (!isSuperAdmin || !editingRow?.schoolId || !schools.length) return;

    const match = schools.find((school) => String(school.id) === String(editingRow.schoolId));
    if (!match) return;

    const nextHeadOfficeId = match.headOfficeId != null ? String(match.headOfficeId) : "";
    const nextSchoolId = String(editingRow.schoolId);

    if (
      String(manualScope.selectedHeadOfficeId || "") === nextHeadOfficeId &&
      String(manualScope.selectedSchoolId || "") === nextSchoolId
    ) {
      return;
    }

    manualScope.setSelectedScope(nextHeadOfficeId, nextSchoolId);
  }, [
    editingRow?.schoolId,
    isSuperAdmin,
    manualScope.selectedHeadOfficeId,
    manualScope.selectedSchoolId,
    manualScope.setSelectedScope,
    schools,
  ]);

  useEffect(() => {
    if (!isSuperAdmin || !manualScope.selectedSchoolId) return;
    setForm((prev) => ({
      ...prev,
      headOfficeId: manualScope.selectedHeadOfficeId || prev.headOfficeId,
      schoolId: String(manualScope.selectedSchoolId),
      classId: "",
    }));
  }, [isSuperAdmin, manualScope.selectedHeadOfficeId, manualScope.selectedSchoolId]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!form.schoolId || form.receiverType !== "Student") {
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
  }, [form.schoolId, form.receiverType]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!form.schoolId || !form.classId || form.receiverType !== "Student") {
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
  }, [form.schoolId, form.classId, form.receiverType]);

  useEffect(() => {
    if (!editingRow || form.receiverType !== "Student" || !classes.length || form.classId) return;
    const match = classes.find((item) => {
      const label = item?.className || item?.name || "";
      return label && label === (editingRow.className || "");
    });
    if (match) {
      setForm((prev) => ({ ...prev, classId: String(match.id) }));
    }
  }, [editingRow, classes, form.receiverType, form.classId]);

  useEffect(() => {
    const loadTeachers = async () => {
      if (!form.schoolId || form.receiverType !== "Teacher") {
        setTeachers([]);
        return;
      }
      setLoadingTeachers(true);
      try {
        const data = await fetchTeachers();
        const list = Array.isArray(data) ? data : [];
        setTeachers(
          list.filter(
            (teacher) =>
              String(teacher?.schoolId ?? "") === String(form.schoolId) &&
              String(teacher?.email || "").trim(),
          ),
        );
      } catch {
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }
    };
    void loadTeachers();
  }, [form.schoolId, form.receiverType]);

  useEffect(() => {
    return () => sessionStorage.removeItem(EMAIL_EDIT_STORAGE_KEY);
  }, []);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions || [];
    if (isSchoolAdmin) return currentSchoolOption ? [currentSchoolOption] : [];
    return Array.isArray(schools) ? schools : [];
  }, [currentSchoolOption, isSchoolAdmin, schools, isSuperAdmin, manualScope.schoolOptions]);

  const selectedSchool = useMemo(
    () => schoolOptions.find((school) => String(school.id) === String(form.schoolId)),
    [schoolOptions, form.schoolId],
  );

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === String(form.classId)),
    [classes, form.classId],
  );

  const receiverOptions = useMemo(() => {
    if (form.receiverType === "Student") {
      return (Array.isArray(students) ? students : [])
        .map((student) => {
          const email = String(student?.email || "").trim();
          if (!email) return null;
          const name =
            student?.name || student?.studentName || student?.fullName || "Unnamed Student";
          const rollNo = student?.rollNo ? ` - Roll No: ${student.rollNo}` : "";
          const className = student?.className ? ` - ${student.className}` : "";
          return { value: email, label: `${name}${rollNo}${className} - ${email}` };
        })
        .filter(Boolean);
    }
    if (form.receiverType === "Teacher") {
      return (Array.isArray(teachers) ? teachers : [])
        .map((teacher) => {
          const email = String(teacher?.email || "").trim();
          if (!email) return null;
          const name = teacher?.name || teacher?.teacherName || "Unnamed Teacher";
          const designation = teacher?.designationName || teacher?.designation || "";
          const suffix = designation ? ` - ${designation}` : "";
          return { value: email, label: `${name}${suffix} - ${email}` };
        })
        .filter(Boolean);
    }
    return [];
  }, [form.receiverType, students, teachers]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => {
      if (id === "schoolId") {
        const school = schoolOptions.find((item) => String(item.id) === String(value));
        return {
          ...prev,
          schoolId: value,
          headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
          classId: "",
          receiver: "",
        };
      }
      if (id === "classId") return { ...prev, classId: value, receiver: "" };
      if (id === "receiverType") {
        return {
          ...prev,
          receiverType: value,
          classId: value === "Student" ? prev.classId : "",
          receiver: "",
        };
      }
      return { ...prev, [id]: value };
    });
  };

  const validate = () => {
    if (!form.schoolId) return "School is required";
    if (!form.receiverType) return "Receiver Type is required";
    if (form.receiverType === "Student" && !form.classId) return "Class is required";
    if (!form.receiver) return "Receiver is required";
    if (!form.subject.trim()) return "Subject is required";
    if (!form.emailBody.trim()) return "Email Body is required";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    const payload = {
      headOfficeId:
        selectedSchool?.headOfficeId != null
          ? Number(selectedSchool.headOfficeId)
          : form.headOfficeId
            ? Number(form.headOfficeId)
            : null,
      schoolId: Number(form.schoolId),
      schoolName: selectedSchool?.schoolName || "Selected School",
      className:
        form.receiverType === "Student"
          ? selectedClass?.className || selectedClass?.name || null
          : null,
      receiverType: form.receiverType,
      receiver: form.receiver.trim(),
      subject: form.subject.trim(),
      emailBody: form.emailBody.trim(),
    };

    setError("");
    try {
      if (editId) {
        await updateEmail(editId, payload);
        setSuccessMessage("Email updated successfully.");
      } else {
        await createEmail(payload);
        setSuccessMessage("Email sent successfully.");
      }
      setSuccess(true);
      sessionStorage.removeItem(EMAIL_EDIT_STORAGE_KEY);
      setTimeout(() => onNavigate?.("email"), 900);
    } catch (err) {
      setError(err?.message || "Failed to send email.");
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">
          {editId ? "Edit Send Email" : "Send New Email"}
        </h1>
        <button
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => onNavigate?.("email")}
        >
          <i className="ri-arrow-left-line"></i> Back to History
        </button>
      </div>

      {loadingEdit ? <div className="alert alert-info mb-24 radius-8">Loading email record...</div> : null}
      {error ? <div className="alert alert-danger mb-24 radius-8">{error}</div> : null}
      {success ? <div className="alert alert-success mb-24 radius-8">{successMessage}</div> : null}

      <div className="card">
        <div className="card-body">
          <form className="avm-grid" onSubmit={handleSubmit}>
            {isSuperAdmin ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <ManualScopeSelectors
                  enabled={isSuperAdmin}
                  headOffices={manualScope.headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                  onHeadOfficeChange={(value) => {
                    manualScope.setSelectedScope(value, "");
                    setForm((prev) => ({
                      ...prev,
                      headOfficeId: value,
                      schoolId: "",
                      classId: "",
                      receiver: "",
                    }));
                  }}
                  selectedSchoolId={form.schoolId}
                  onSchoolChange={(value) => {
                    const school = schoolOptions.find((item) => String(item.id) === String(value));
                    manualScope.setSelectedScope(manualScope.selectedHeadOfficeId, value);
                    setForm((prev) => ({
                      ...prev,
                      schoolId: value,
                      headOfficeId: school?.headOfficeId != null ? String(school.headOfficeId) : prev.headOfficeId,
                      classId: "",
                      receiver: "",
                    }));
                  }}
                  compact
                />
              </div>
            ) : (
              <FormField label="School Name" required>
                <select className="avm-select" id="schoolId" value={form.schoolId} onChange={handleChange}>
                  <option value="">--Select School--</option>
                  {schoolOptions.map((school) => (
                    <option key={String(school.id)} value={String(school.id)}>
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Receiver Type" required>
              <select className="avm-select" id="receiverType" value={form.receiverType} onChange={handleChange}>
                <option value="">--Select--</option>
                {EMAIL_RECEIVER_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </FormField>

            {form.receiverType === "Student" ? (
              <FormField label="Class" required>
                <select
                  className="avm-select"
                  id="classId"
                  value={form.classId}
                  onChange={handleChange}
                  disabled={!form.schoolId}
                >
                  <option value="">{form.schoolId ? "--Select Class--" : "Select School First"}</option>
                  {classes.map((option) => (
                    <option key={String(option.id)} value={String(option.id)}>
                      {option.className || option.name || String(option.id)}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : null}

            <FormField label="Receiver" required>
              <select
                className="avm-select"
                id="receiver"
                value={form.receiver}
                onChange={handleChange}
                disabled={!form.schoolId || !form.receiverType || (form.receiverType === "Student" && !form.classId)}
              >
                <option value="">
                  {form.receiverType === "Student"
                    ? form.classId
                      ? loadingStudents
                        ? "Loading Students..."
                        : "--Select Student--"
                      : "Select Class First"
                    : form.receiverType === "Teacher"
                      ? loadingTeachers
                        ? "Loading Teachers..."
                        : "--Select Teacher--"
                      : "--Select--"}
                </option>
                {receiverOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Subject" required full>
              <input
                type="text"
                className="avm-input"
                id="subject"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
              />
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">
                Email Body <span className="text-danger-600">*</span>
              </label>
              <textarea
                rows={8}
                className="form-control"
                id="emailBody"
                placeholder="Write your email body here..."
                value={form.emailBody}
                onChange={handleChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button
                type="button"
                className="btn btn-outline-neutral px-24 py-12 radius-8"
                onClick={() => onNavigate?.("email")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-24 py-12 radius-8 d-flex align-items-center gap-8"
              >
                <i className="ri-send-plane-2-line"></i> {editId ? "Update" : "Send Email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailCreate;
