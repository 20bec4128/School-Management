import { useEffect, useMemo, useRef, useState } from "react";
import { createAssignment, updateAssignment } from "../apis/assignmentsApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchSections } from "../apis/sectionsApi";
import { fetchSubjects } from "../apis/subjectsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { findSchoolById } from "../utils/schoolScope";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "edit-assignment-row";
const STEPS = ["Basic Info", "Dates & Settings"];
const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.txt";
const ACCEPTED_DOC_LABEL = ".pdf, .doc/docx, .ppt/pptx or .txt";

const emptyForm = {
  schoolId: "Select",
  classId: "Select",
  sectionId: "Select",
  subjectId: "Select",
  title: "",
  assignmentDate: "",
  submissionDate: "",
  smsNotification: false,
  emailNotification: false,
  note: "",
};

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  Class: "ri-building-line",
  Section: "ri-layout-grid-line",
  Subject: "ri-book-open-line",
  Title: "ri-file-list-2-line",
  "Assignment Date": "ri-calendar-2-line",
  "Submission Date": "ri-calendar-check-line",
  Note: "ri-sticky-note-line",
  Assignment: "ri-attachment-2",
};

const getBestLabel = (...values) =>
  values
    .map((value) => {
      if (value == null) return "";
      const text = String(value).trim();
      return text === "null" || text === "undefined" ? "" : text;
    })
    .find(Boolean) || "";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getLookupId = (row, keys = ["id"]) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value != null && value !== "") return value;
  }
  return null;
};

const getSchoolIdFromRow = (row) =>
  row?.schoolId ?? row?.school?.id ?? row?.school?.schoolId ?? null;
const getSchoolNameFromRow = (row) =>
  row?.schoolName ??
  row?.school?.schoolName ??
  row?.school?.name ??
  row?.name ??
  row?.label ??
  "";
const getClassIdFromRow = (row) =>
  row?.id ?? row?.classId ?? row?.schoolClass?.id ?? row?.schoolClassId ?? null;
const getClassNameFromRow = (row) =>
  row?.className ??
  row?.numericName ??
  row?.name ??
  row?.label ??
  row?.schoolClass?.className ??
  row?.schoolClass?.name ??
  "";
const getSectionIdFromRow = (row) =>
  row?.id ??
  row?.sectionId ??
  row?.schoolSection?.id ??
  row?.schoolSectionId ??
  null;
const getSectionNameFromRow = (row) =>
  row?.sectionName ??
  row?.name ??
  row?.label ??
  row?.schoolSection?.sectionName ??
  row?.schoolSection?.name ??
  "";
const getSubjectIdFromRow = (row) => row?.id ?? row?.subjectId ?? null;
const getSubjectNameFromRow = (row) =>
  row?.name ?? row?.subjectName ?? row?.label ?? "";
const getExistingFileName = (row) =>
  row?.assignmentFile ||
  row?.fileName ||
  row?.attachmentName ||
  row?.documentName ||
  "";
const getExistingFileUrl = (row) =>
  row?.assignmentFileUrl ||
  row?.fileUrl ||
  row?.attachmentUrl ||
  row?.documentUrl ||
  row?.assignmentFile ||
  row?.filePath ||
  "";

const rowMatchesSchool = (row, schoolId, schoolName = "") => {
  const targetId = schoolId != null && schoolId !== "" ? String(schoolId) : "";
  const targetName = normalizeText(schoolName);
  const rowSchoolId = getSchoolIdFromRow(row);
  const rowSchoolName = normalizeText(getSchoolNameFromRow(row));
  return (
    (targetId && rowSchoolId != null && String(rowSchoolId) === targetId) ||
    (targetName && rowSchoolName && rowSchoolName === targetName)
  );
};

const rowMatchesClass = (row, classId, className = "") => {
  const targetId = classId != null && classId !== "" ? String(classId) : "";
  const targetName = normalizeText(className);
  const rowClassId = getClassIdFromRow(row);
  const rowClassName = normalizeText(getClassNameFromRow(row));
  return (
    (targetId && rowClassId != null && String(rowClassId) === targetId) ||
    (targetName && rowClassName && rowClassName === targetName)
  );
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

const NotificationToggle = ({ id, label, icon, checked, onChange }) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.65rem",
      cursor: "pointer",
      padding: "0.7rem 1rem",
      background: checked ? "#e8edf4" : "#f8fafc",
      border: `1px solid ${checked ? "#45597a" : "#d0d5dd"}`,
      borderRadius: "0.75rem",
      transition: "all 0.18s",
      userSelect: "none",
      flex: 1,
    }}
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      style={{ width: 16, height: 16, accentColor: "#45597a", flexShrink: 0 }}
    />
    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <i
        className={icon}
        style={{ color: checked ? "#45597a" : "#7a8a9a", fontSize: "1rem" }}
      ></i>
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: checked ? "#45597a" : "#34393f",
        }}
      >
        {label}
      </span>
    </span>
    {checked ? (
      <span
        style={{
          marginLeft: "auto",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "#45597a",
          background: "#c8d4e8",
          borderRadius: "2rem",
          padding: "0.15rem 0.55rem",
          whiteSpace: "nowrap",
        }}
      >
        On
      </span>
    ) : null}
  </label>
);

const AddAssignment = ({ onNavigate }) => {
  const {
    user,
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool();
  const roleUpper = String(role || "").toUpperCase();
  const isSuperAdmin = roleUpper === "SUPER_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);

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
        subjectId:
          initialEditRow.subjectId != null
            ? String(initialEditRow.subjectId)
            : "Select",
        title: initialEditRow.title || "",
        assignmentDate: initialEditRow.assignmentDate || "",
        submissionDate: initialEditRow.submissionDate || "",
        smsNotification: !!initialEditRow.smsNotification,
        emailNotification: !!initialEditRow.emailNotification,
        note: initialEditRow.note || "",
      };
    }
    return {
      ...emptyForm,
      schoolId:
        activeSchoolId || authSchoolId
          ? String(activeSchoolId || authSchoolId)
          : "Select",
    };
  });
  const [file, setFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(() =>
    initialEditRow ? getExistingFileName(initialEditRow) : "",
  );
  const [filePreviewUrl, setFilePreviewUrl] = useState(() =>
    initialEditRow ? getExistingFileUrl(initialEditRow) : "",
  );
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [classesLookup, setClassesLookup] = useState([]);
  const [sectionsLookup, setSectionsLookup] = useState([]);
  const [subjectsLookup, setSubjectsLookup] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  useEffect(() => {
    return () => {
      if (filePreviewUrl && String(filePreviewUrl).startsWith("blob:")) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin) return;
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
    let cancelled = false;
    const loadSchools = async () => {
      try {
        const list = await fetchSchoolsLookup();
        if (!cancelled) setSchoolsLookup(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setSchoolsLookup([]);
      }
    };
    void loadSchools();
    return () => {
      cancelled = true;
    };
  }, []);

  const schoolIdForLookups = form.schoolId !== "Select" ? form.schoolId : "";

  useEffect(() => {
    if (!schoolIdForLookups) {
      setClassesLookup([]);
      setSectionsLookup([]);
      setSubjectsLookup([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [classRows, sectionRows, subjectRows] = await Promise.all([
          fetchClasses({ schoolId: schoolIdForLookups }).catch(() => []),
          fetchSections({ schoolId: schoolIdForLookups }).catch(() => []),
          fetchSubjects().catch(() => []),
        ]);
        if (cancelled) return;
        setClassesLookup(Array.isArray(classRows) ? classRows : []);
        setSectionsLookup(Array.isArray(sectionRows) ? sectionRows : []);
        setSubjectsLookup(Array.isArray(subjectRows) ? subjectRows : []);
      } catch {
        if (cancelled) return;
        setClassesLookup([]);
        setSectionsLookup([]);
        setSubjectsLookup([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [schoolIdForLookups]);

  useEffect(() => {
    if (!schoolIdForLookups || form.classId === "Select") return;
    let cancelled = false;
    const loadSections = async () => {
      try {
        const rows = await fetchSections({
          schoolId: schoolIdForLookups,
          classId: form.classId,
        });
        if (!cancelled) setSectionsLookup(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setSectionsLookup([]);
      }
    };
    void loadSections();
    return () => {
      cancelled = true;
    };
  }, [form.classId, schoolIdForLookups]);

  const schoolOptions = useMemo(() => {
    if (isSuperAdmin) return manualScope.schoolOptions;
    if (authHeadOfficeId != null) {
      return (Array.isArray(schoolsLookup) ? schoolsLookup : []).filter(
        (school) =>
          String(school?.headOfficeId ?? "") === String(authHeadOfficeId),
      );
    }
    if (authSchoolId != null) {
      return (Array.isArray(schoolsLookup) ? schoolsLookup : []).filter(
        (school) => String(school?.id ?? "") === String(authSchoolId),
      );
    }
    return Array.isArray(contextSchoolOptions)
      ? contextSchoolOptions
      : schoolsLookup;
  }, [
    authHeadOfficeId,
    authSchoolId,
    contextSchoolOptions,
    isSuperAdmin,
    manualScope.schoolOptions,
    schoolsLookup,
  ]);

  const schoolNameById = useMemo(() => {
    const map = new Map();
    for (const school of schoolsLookup) {
      const id = getLookupId(school, ["id", "schoolId"]);
      const name = getBestLabel(
        school?.schoolName,
        school?.name,
        school?.label,
      );
      if (id != null && name) map.set(String(id), name);
    }
    return map;
  }, [schoolsLookup]);

  const classOptions = useMemo(() => {
    return (Array.isArray(classesLookup) ? classesLookup : [])
      .filter(
        (row) =>
          !schoolIdForLookups ||
          rowMatchesSchool(
            row,
            schoolIdForLookups,
            schoolNameById.get(String(schoolIdForLookups)),
          ),
      )
      .slice()
      .sort((a, b) =>
        getBestLabel(a.className, a.numericName, a.name, a.label).localeCompare(
          getBestLabel(b.className, b.numericName, b.name, b.label),
        ),
      );
  }, [classesLookup, schoolIdForLookups, schoolNameById]);

  const sectionOptions = useMemo(() => {
    return (Array.isArray(sectionsLookup) ? sectionsLookup : [])
      .filter((row) => {
        if (
          schoolIdForLookups &&
          !rowMatchesSchool(
            row,
            schoolIdForLookups,
            schoolNameById.get(String(schoolIdForLookups)),
          )
        )
          return false;
        if (
          form.classId !== "Select" &&
          !rowMatchesClass(
            row,
            form.classId,
            classOptions.find((c) => String(c.id) === String(form.classId))
              ?.className || "",
          )
        )
          return false;
        return true;
      })
      .slice()
      .sort((a, b) =>
        getBestLabel(a.sectionName, a.name, a.label).localeCompare(
          getBestLabel(b.sectionName, b.name, b.label),
        ),
      );
  }, [
    classOptions,
    form.classId,
    schoolIdForLookups,
    schoolNameById,
    sectionsLookup,
  ]);

  const subjectOptions = useMemo(() => {
    return (Array.isArray(subjectsLookup) ? subjectsLookup : [])
      .filter((row) => {
        if (
          schoolIdForLookups &&
          !rowMatchesSchool(
            row,
            schoolIdForLookups,
            schoolNameById.get(String(schoolIdForLookups)),
          )
        )
          return false;
        if (
          form.classId !== "Select" &&
          !rowMatchesClass(
            row,
            form.classId,
            classOptions.find((c) => String(c.id) === String(form.classId))
              ?.className || "",
          )
        )
          return false;
        return true;
      })
      .slice()
      .sort((a, b) =>
        getBestLabel(a.name, a.subjectName, a.label).localeCompare(
          getBestLabel(b.name, b.subjectName, b.label),
        ),
      );
  }, [
    classOptions,
    form.classId,
    schoolIdForLookups,
    schoolNameById,
    subjectsLookup,
  ]);

  const selectedSchoolName = useMemo(() => {
    if (form.schoolId === "Select") return authSchoolName || "";
    return (
      schoolNameById.get(String(form.schoolId)) ||
      authSchoolName ||
      `School ${form.schoolId}`
    );
  }, [authSchoolName, form.schoolId, schoolNameById]);

  const selectedClassName = useMemo(
    () =>
      classOptions.find((item) => String(item.id) === String(form.classId))
        ?.className || getBestLabel(form.classId),
    [classOptions, form.classId],
  );
  const selectedSectionName = useMemo(
    () =>
      sectionOptions.find((item) => String(item.id) === String(form.sectionId))
        ?.sectionName || getBestLabel(form.sectionId),
    [form.sectionId, sectionOptions],
  );
  const selectedSubjectName = useMemo(
    () =>
      subjectOptions.find((item) => String(item.id) === String(form.subjectId))
        ?.name || getBestLabel(form.subjectId),
    [form.subjectId, subjectOptions],
  );

  const handleChange = (id, value) => {
    setForm((prev) => {
      if (id === "schoolId")
        return {
          ...prev,
          schoolId: value,
          classId: "Select",
          sectionId: "Select",
          subjectId: "Select",
        };
      if (id === "classId")
        return {
          ...prev,
          classId: value,
          sectionId: "Select",
          subjectId: "Select",
        };
      if (id === "sectionId")
        return { ...prev, sectionId: value, subjectId: "Select" };
      return { ...prev, [id]: value };
    });
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;

    setFile(nextFile);
    setSelectedFileName(
      nextFile?.name || getExistingFileName(initialEditRow) || "",
    );
    setFilePreviewUrl((prev) => {
      if (prev && String(prev).startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      if (nextFile) return URL.createObjectURL(nextFile);
      return getExistingFileUrl(initialEditRow) || "";
    });
  };

  const handleViewFile = () => {
    if (!filePreviewUrl) return;
    window.open(filePreviewUrl, "_blank", "noopener,noreferrer");
  };

  const validateStep = (step = activeStep) => {
    if (form.schoolId === "Select") return "School is required.";
    if (form.classId === "Select") return "Class is required.";
    if (form.sectionId === "Select") return "Section is required.";
    if (form.subjectId === "Select") return "Subject is required.";
    if (step === 0 && !String(form.title || "").trim())
      return "Title is required.";
    if (step >= 1 && !String(form.assignmentDate || "").trim())
      return "Assignment date is required.";
    if (step >= 1 && !String(form.submissionDate || "").trim())
      return "Submission date is required.";
    return "";
  };

  const validate = () => {
    if (validateStep(0)) return validateStep(0);
    if (validateStep(1)) return validateStep(1);
    return "";
  };

  const save = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        schoolId: Number(form.schoolId),
        classId: Number(form.classId),
        sectionId: Number(form.sectionId),
        subjectId: Number(form.subjectId),
      };
      if (editingId) {
        await updateAssignment(editingId, payload, file);
      } else {
        await createAssignment(payload, file);
      }
      setSuccess(true);
      setTimeout(() => onNavigate?.("assignment"), 900);
    } catch (err) {
      setError(
        err?.message ||
          (editingId
            ? "Failed to update assignment"
            : "Failed to create assignment"),
      );
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    const message = validateStep(activeStep);
    if (message) {
      setError(message);
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    setError("");
  };

  const prevStep = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
    setError("");
  };

  const goToStep = (index) => {
    if (index <= activeStep) {
      setActiveStep(index);
      setError("");
      return;
    }

    const message = validateStep(activeStep);
    if (message) {
      setError(message);
      return;
    }

    setActiveStep(index);
    setError("");
  };

  const renderStep = () => {
    if (activeStep === 0) {
      return (
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
                  value={selectedSchoolName}
                  readOnly
                />
              </FormField>
            </div>
          )}

          <div className="col-12 avm-grid">
            <FormField label="Class" required>
              <select
                className="form-select avm-input ps-44"
                id="classId"
                value={form.classId}
                onChange={(e) => handleChange("classId", e.target.value)}
                disabled={form.schoolId === "Select"}
              >
                <option value="Select">Select</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {getBestLabel(c.className, c.numericName, c.name, c.label)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Section" required>
              <select
                className="form-select avm-input ps-44"
                id="sectionId"
                value={form.sectionId}
                onChange={(e) => handleChange("sectionId", e.target.value)}
                disabled={form.classId === "Select"}
              >
                <option value="Select">Select</option>
                {sectionOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {getBestLabel(s.sectionName, s.name, s.label)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Subject" required>
              <select
                className="form-select avm-input ps-44"
                id="subjectId"
                value={form.subjectId}
                onChange={(e) => handleChange("subjectId", e.target.value)}
                disabled={form.classId === "Select"}
              >
                <option value="Select">Select</option>
                {subjectOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {getBestLabel(s.name, s.subjectName, s.label)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Title" required>
              <input
                className="form-control avm-input ps-44"
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Assignment title"
              />
            </FormField>

            <FormField label="Assignment" full noIcon>
              <div className="d-flex align-items-center gap-2 flex-wrap">
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
          </div>
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="row g-20">
          <div className="col-12 avm-grid">
          <FormField label="Assignment Date" required>
            <input
              className="form-control avm-input ps-44"
              id="assignmentDate"
              type="date"
              value={form.assignmentDate}
              onChange={(e) => handleChange("assignmentDate", e.target.value)}
            />
          </FormField>

          <FormField label="Submission Date" required>
            <input
              className="form-control avm-input ps-44"
              id="submissionDate"
              type="date"
              value={form.submissionDate}
              onChange={(e) => handleChange("submissionDate", e.target.value)}
            />
          </FormField>

          <div className="col-12">
            <label className="avm-label">Notifications</label>
            <div className="d-flex gap-3 flex-wrap">
              <NotificationToggle
                id="smsNotification"
                label="SMS"
                icon="ri-message-2-line"
                checked={!!form.smsNotification}
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    smsNotification: !prev.smsNotification,
                  }))
                }
              />
              <NotificationToggle
                id="emailNotification"
                label="Email"
                icon="ri-mail-line"
                checked={!!form.emailNotification}
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    emailNotification: !prev.emailNotification,
                  }))
                }
              />
            </div>
          </div>

          <FormField label="Note">
            <textarea
              className="form-control avm-input ps-44"
              id="note"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              rows={3}
              placeholder="Optional note"
            />
          </FormField>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? "Edit" : "Add"} Assignment
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
              / Assignment / {editingId ? "Edit" : "Add"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => onNavigate?.("assignment")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card h-100">
        <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
          {STEPS.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => goToStep(idx)}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeStep === idx
                    ? "2px solid var(--primary-600, #4f46e5)"
                    : "2px solid transparent",
                color:
                  activeStep === idx
                    ? "var(--primary-600, #4f46e5)"
                    : "var(--secondary-light, #667085)",
                fontWeight: activeStep === idx ? 600 : 400,
                padding: "14px 20px",
                cursor: "pointer",
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body p-24">
          {error ? (
            <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-error-warning-line text-lg" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-checkbox-circle-line text-lg" />
              Assignment {editingId ? "updated" : "created"} successfully!
              Redirecting...
            </div>
          ) : null}

          <div className="tab-content">{renderStep()}</div>

          <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
            <button
              type="button"
              className="btn btn-light border px-24"
              onClick={() => onNavigate?.("assignment")}
            >
              Cancel
            </button>
            {activeStep > 0 ? (
              <button
                type="button"
                className="btn btn-light border px-24"
                onClick={prevStep}
              >
                Previous
              </button>
            ) : null}
            {activeStep < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary-600 px-24"
                onClick={nextStep}
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary-600 px-24 d-flex align-items-center gap-8"
                onClick={save}
                disabled={saving || loading}
              >
                {saving ? (
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
                    {editingId ? "Update" : "Save"} Assignment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAssignment;
