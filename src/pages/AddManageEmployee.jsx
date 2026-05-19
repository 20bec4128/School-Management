import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhoneCodeField from "../components/PhoneCodeField";
import {
  createEmployee,
  updateEmployee,
} from "../apis/employeesApi";
import { fetchDesignations } from "../apis/designationsApi";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { fetchSalaryGrades } from "../apis/salaryGradeApi";
import { fetchSchoolRoles } from "../apis/schoolRbacApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { findSchoolById } from "../utils/schoolScope";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import SingleStepFormShell from "../components/SingleStepFormShell";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "edit-employee-row";

const STEPS = [
  "School & Basic Information",
  "Address Info",
  "Academic Info",
  "Other Info",
];

const emptyForm = {
  id: null,
  headOfficeId: "",
  schoolId: "",
  designationId: "",
  name: "",
  nationalId: "",
  phone: "",
  gender: "",
  bloodGroup: "",
  religion: "",
  birthDate: "",
  presentAddress: "",
  permanentAddress: "",
  email: "",
  username: "",
  password: "",
  salaryGrade: "",
  salaryType: "",
  role: "",
  joiningDate: "",
  resume: null,
  isViewOnWeb: "",
  facebookUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  pinterestUrl: "",
  otherInfo: "",
  photo: null,
};

const FIELD_ICONS = {
  "Head Office": "ri-government-line",
  "School Name": "ri-school-line",
  Name: "ri-user-3-line",
  "National ID": "ri-fingerprint-line",
  Designation: "ri-award-line",
  Gender: "ri-user-settings-line",
  "Blood Group": "ri-heart-pulse-line",
  Religion: "ri-bookmark-3-line",
  "Birth Date": "ri-calendar-2-line",
  "Present Address": "ri-map-pin-2-line",
  "Permanent Address": "ri-home-4-line",
  Email: "ri-mail-line",
  Username: "ri-at-line",
  Password: "ri-lock-2-line",
  "Salary Grade": "ri-medal-line",
  "Salary Type": "ri-money-dollar-circle-line",
  Role: "ri-shield-user-line",
  "Joining Date": "ri-calendar-check-line",
  Resume: "ri-file-text-line",
  "Is View on Web?": "ri-global-line",
  "Facebook URL": "ri-facebook-circle-line",
  "LinkedIn URL": "ri-linkedin-box-line",
  "Twitter URL": "ri-twitter-x-line",
  "Instagram URL": "ri-instagram-line",
  "Youtube URL": "ri-youtube-line",
  "Pinterest URL": "ri-pinterest-line",
  "Other Info": "ri-information-line",
  Photo: "ri-image-2-line",
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

const trimOrNull = (value) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const toNumberOrNull = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const num = Number(text);
  return Number.isFinite(num) ? num : null;
};

const formatRoleLabel = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const AddManageEmployee = ({ onNavigate }) => {
  const {
    status,
    role,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();

  const { activeSchoolId } = useSchool();

  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const isHeadOfficeAdmin =
    String(role || "").toUpperCase() === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = String(role || "").toUpperCase() === "SCHOOL_ADMIN";
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
  const isEditMode = Boolean(editingId);

  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [salaryGrades, setSalaryGrades] = useState([]);
  const [roles, setRoles] = useState([]);
  const [salaryGradeLoading, setSalaryGradeLoading] = useState(false);

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        id: initialEditRow?.id ?? null,
        schoolId:
          initialEditRow?.schoolId != null
            ? String(initialEditRow.schoolId)
            : "",
        designationId:
          initialEditRow?.designationId != null
            ? String(initialEditRow.designationId)
            : "",
        name: initialEditRow?.name || "",
        nationalId: initialEditRow?.nationalId || "",
        phone: initialEditRow?.phone || "",
        gender: initialEditRow?.gender || "",
        bloodGroup: initialEditRow?.bloodGroup || "",
        religion: initialEditRow?.religion || "",
        birthDate: initialEditRow?.birthDate || "",
        presentAddress: initialEditRow?.presentAddress || "",
        permanentAddress: initialEditRow?.permanentAddress || "",
        email: initialEditRow?.email || "",
        username: initialEditRow?.username || "",
        password: "",
        salaryGrade: initialEditRow?.salaryGrade || "",
        salaryType: initialEditRow?.salaryType || "",
        role: initialEditRow?.role || "",
        joiningDate: initialEditRow?.joiningDate || "",
        resume: null,
        isViewOnWeb: initialEditRow?.isViewOnWeb || "",
        facebookUrl: initialEditRow?.facebookUrl || "",
        linkedinUrl: initialEditRow?.linkedinUrl || "",
        twitterUrl: initialEditRow?.twitterUrl || "",
        instagramUrl: initialEditRow?.instagramUrl || "",
        youtubeUrl: initialEditRow?.youtubeUrl || "",
        pinterestUrl: initialEditRow?.pinterestUrl || "",
        otherInfo: initialEditRow?.otherInfo || "",
        photo: null,
      };
    }

    return {
      ...emptyForm,
      headOfficeId: isSchoolAdmin
        ? authHeadOfficeId != null
          ? String(authHeadOfficeId)
          : ""
        : isHeadOfficeAdmin
          ? authHeadOfficeId != null
            ? String(authHeadOfficeId)
            : ""
          : "",
      schoolId: isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : ""
        : isHeadOfficeAdmin && activeSchoolId
          ? String(activeSchoolId)
          : "",
    };
  });

  const [activeStep, setActiveStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(
    initialEditRow?.photoUrl || null,
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const photoRef = useRef();

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  const currentSchoolOption = useMemo(() => {
    if (!authSchoolId) return null;

    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    };
  }, [authHeadOfficeId, authSchoolId, authSchoolName]);

  const schoolById = useMemo(() => {
    const map = new Map();

    for (const item of schools) {
      if (item?.id == null) continue;
      map.set(String(item.id), item);
    }

    if (
      currentSchoolOption?.id != null &&
      !map.has(String(currentSchoolOption.id))
    ) {
      map.set(String(currentSchoolOption.id), currentSchoolOption);
    }

    return map;
  }, [currentSchoolOption, schools]);

  const headOfficeById = useMemo(() => {
    const map = new Map();

    for (const item of headOffices) {
      if (item?.id == null) continue;
      map.set(String(item.id), item);
    }

    if (authHeadOfficeId != null && !map.has(String(authHeadOfficeId))) {
      map.set(String(authHeadOfficeId), {
        id: authHeadOfficeId,
        name: authHeadOfficeName || `Head Office ${authHeadOfficeId}`,
      });
    }

    return map;
  }, [authHeadOfficeId, authHeadOfficeName, headOffices]);

  const formSchoolId = isSchoolAdmin
    ? authSchoolId != null
      ? String(authSchoolId)
      : ""
    : String(form.schoolId || "");

  const formHeadOfficeId = isSchoolAdmin
    ? authHeadOfficeId != null
      ? String(authHeadOfficeId)
      : ""
    : isHeadOfficeAdmin
      ? authHeadOfficeId != null
        ? String(authHeadOfficeId)
        : ""
      : String(form.headOfficeId || "");

  const formSchools = useMemo(() => {
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : [];
    }

    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId =
        authHeadOfficeId != null ? String(authHeadOfficeId) : "";

      return schools
        .filter(
          (school) =>
            String(school?.headOfficeId ?? "") === targetHeadOfficeId,
        )
        .sort((a, b) =>
          String(a?.schoolName || "").localeCompare(
            String(b?.schoolName || ""),
          ),
        );
    }

    if (!formHeadOfficeId) return [];

    return schools
      .filter(
        (school) =>
          String(school?.headOfficeId ?? "") === String(formHeadOfficeId),
      )
      .sort((a, b) =>
        String(a?.schoolName || "").localeCompare(
          String(b?.schoolName || ""),
        ),
      );
  }, [
    authHeadOfficeId,
    currentSchoolOption,
    formHeadOfficeId,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    schools,
  ]);

  const formSchoolName = useMemo(() => {
    if (!formSchoolId) return "";

    return (
      schoolById.get(String(formSchoolId))?.schoolName ||
      currentSchoolOption?.schoolName ||
      `School ${formSchoolId}`
    );
  }, [currentSchoolOption?.schoolName, formSchoolId, schoolById]);

  const formHeadOfficeName = useMemo(() => {
    if (isSchoolAdmin || isHeadOfficeAdmin) {
      return (
        authHeadOfficeName ||
        headOfficeById.get(String(authHeadOfficeId || ""))?.name ||
        (authHeadOfficeId != null ? `Head Office ${authHeadOfficeId}` : "")
      );
    }

    if (!formSchoolId) {
      return formHeadOfficeId
        ? headOfficeById.get(String(formHeadOfficeId))?.name ||
            `Head Office ${formHeadOfficeId}`
        : "";
    }

    const school = schoolById.get(String(formSchoolId));

    if (!school?.headOfficeId) {
      return formHeadOfficeId
        ? headOfficeById.get(String(formHeadOfficeId))?.name ||
            `Head Office ${formHeadOfficeId}`
        : "";
    }

    return (
      headOfficeById.get(String(school.headOfficeId))?.name ||
      `Head Office ${school.headOfficeId}`
    );
  }, [
    authHeadOfficeId,
    authHeadOfficeName,
    formHeadOfficeId,
    formSchoolId,
    headOfficeById,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    schoolById,
  ]);

  const loadScopeLookups = useCallback(async () => {
    if (status !== "ready") return;

    setLoading(true);

    try {
      if (isSuperAdmin) {
        const [headOfficePage, schoolList] = await Promise.all([
          fetchHeadOfficesPage(0, 500),
          fetchSchoolsLookup(),
        ]);

        setHeadOffices(
          Array.isArray(headOfficePage?.content)
            ? headOfficePage.content
            : [],
        );
        setSchools(Array.isArray(schoolList) ? schoolList : []);
      } else if (isHeadOfficeAdmin) {
        const schoolList = await fetchSchoolsLookup();
        const targetHeadOfficeId =
          authHeadOfficeId != null ? String(authHeadOfficeId) : "";

        const filteredSchools = (Array.isArray(schoolList) ? schoolList : [])
          .filter(
            (school) =>
              String(school?.headOfficeId ?? "") === targetHeadOfficeId,
          );

        setSchools(filteredSchools);
        setHeadOffices([]);
      } else if (isSchoolAdmin) {
        setSchools(currentSchoolOption ? [currentSchoolOption] : []);
        setHeadOffices(
          authHeadOfficeId != null
            ? [
                {
                  id: authHeadOfficeId,
                  name:
                    authHeadOfficeName ||
                    `Head Office ${authHeadOfficeId}`,
                },
              ]
            : [],
        );
      } else {
        setHeadOffices([]);
        setSchools([]);
      }
    } catch {
      setHeadOffices([]);
      setSchools(
        isSchoolAdmin && currentSchoolOption ? [currentSchoolOption] : [],
      );
    } finally {
      setLoading(false);
    }
  }, [
    authHeadOfficeId,
    authHeadOfficeName,
    currentSchoolOption,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    isSuperAdmin,
    status,
  ]);

  useEffect(() => {
    void loadScopeLookups();
  }, [loadScopeLookups]);

  useEffect(() => {
    if (!initialEditRow || schools.length === 0) return;

    const rowSchoolId =
      initialEditRow?.schoolId != null ? String(initialEditRow.schoolId) : "";

    const rowSchool = rowSchoolId ? schoolById.get(rowSchoolId) : null;

    setForm((prev) => ({
      ...prev,
      headOfficeId: isSchoolAdmin
        ? authHeadOfficeId != null
          ? String(authHeadOfficeId)
          : ""
        : rowSchool?.headOfficeId != null
          ? String(rowSchool.headOfficeId)
          : prev.headOfficeId,
      schoolId: isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : ""
        : rowSchoolId,
    }));

    if (isSuperAdmin && rowSchool?.headOfficeId != null) {
      manualScope.setSelectedScope(String(rowSchool.headOfficeId), rowSchoolId);
    }
  }, [
    authHeadOfficeId,
    authSchoolId,
    initialEditRow,
    isSchoolAdmin,
    isSuperAdmin,
    manualScope,
    schoolById,
    schools,
  ]);

  useEffect(() => {
    if (!formSchoolId) {
      setRoles([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const roleRows = await fetchSchoolRoles({ schoolId: formSchoolId });

        if (cancelled) return;

        setRoles(
          Array.isArray(roleRows)
            ? roleRows
                .map((item) => String(item?.name || "").trim())
                .filter(Boolean)
            : [],
        );
      } catch {
        if (cancelled) return;
        setRoles([]);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [formSchoolId]);

  useEffect(() => {
    if (!formSchoolId || !String(form.role || "").trim()) {
      setDesignations([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const designationRows = await fetchDesignations({
          schoolId: formSchoolId,
          role: form.role,
        });

        if (cancelled) return;

        setDesignations(Array.isArray(designationRows) ? designationRows : []);
      } catch {
        if (cancelled) return;
        setDesignations([]);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [form.role, formSchoolId]);

  useEffect(() => {
    if (!formSchoolId) {
      setSalaryGrades([]);
      setSalaryGradeLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setSalaryGradeLoading(true);

      try {
        const rows = await fetchSalaryGrades({ schoolId: formSchoolId });
        if (cancelled) return;
        setSalaryGrades(Array.isArray(rows) ? rows : []);
      } catch {
        if (cancelled) return;
        setSalaryGrades([]);
      } finally {
        if (!cancelled) setSalaryGradeLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [formSchoolId]);

  const handleFileChange = (e, key) => {
    const file = e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      [key]: file,
    }));

    if (key === "photo" && file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const buildPayload = (sourceForm, schoolId, includePassword) => {
    const payload = {
      schoolId: toNumberOrNull(schoolId),
      designationId: toNumberOrNull(sourceForm.designationId),
      role: trimOrNull(sourceForm.role),
      name: trimOrNull(sourceForm.name),
      nationalId: trimOrNull(sourceForm.nationalId),
      phone: trimOrNull(sourceForm.phone),
      gender: trimOrNull(sourceForm.gender),
      bloodGroup: trimOrNull(sourceForm.bloodGroup),
      religion: trimOrNull(sourceForm.religion),
      birthDate: sourceForm.birthDate || null,
      presentAddress: trimOrNull(sourceForm.presentAddress),
      permanentAddress: trimOrNull(sourceForm.permanentAddress),
      email: trimOrNull(sourceForm.email),
      username: trimOrNull(sourceForm.username),
      salaryGrade: trimOrNull(sourceForm.salaryGrade),
      salaryType: trimOrNull(sourceForm.salaryType),
      joiningDate: sourceForm.joiningDate || null,
      isViewOnWeb: trimOrNull(sourceForm.isViewOnWeb),
      facebookUrl: trimOrNull(sourceForm.facebookUrl),
      linkedinUrl: trimOrNull(sourceForm.linkedinUrl),
      twitterUrl: trimOrNull(sourceForm.twitterUrl),
      instagramUrl: trimOrNull(sourceForm.instagramUrl),
      youtubeUrl: trimOrNull(sourceForm.youtubeUrl),
      pinterestUrl: trimOrNull(sourceForm.pinterestUrl),
      otherInfo: trimOrNull(sourceForm.otherInfo),
    };

    if (includePassword && String(sourceForm.password || "").trim()) {
      payload.password = String(sourceForm.password).trim();
    }

    return payload;
  };

  const resolveSubmissionSchoolId = () => {
    if (isSchoolAdmin) {
      return authSchoolId != null ? String(authSchoolId) : "";
    }

    return String(form.schoolId || "");
  };

  const validateForm = () => {
    const schoolId = resolveSubmissionSchoolId();

    if ((isSuperAdmin || isHeadOfficeAdmin) && !schoolId) {
      return "Please select a school.";
    }

    if (isSuperAdmin && !String(form.headOfficeId || "").trim()) {
      return "Please select a head office.";
    }

    if (!String(form.name || "").trim()) return "Name is required.";
    if (!String(form.phone || "").trim()) return "Phone is required.";
    if (!String(form.birthDate || "").trim()) return "Birth date is required.";
    if (!String(form.username || "").trim()) return "Username is required.";

    if (!isEditMode && !String(form.password || "").trim()) {
      return "Password is required.";
    }

    if (!String(form.designationId || "").trim()) {
      return "Designation is required.";
    }

    if (!String(form.role || "").trim()) return "Role is required.";
    if (!String(form.joiningDate || "").trim()) {
      return "Joining date is required.";
    }

    if (!String(form.gender || "").trim()) return "Gender is required.";

    return "";
  };

  const validateStep = (step) => {
    if (step === 0) {
      if ((isSuperAdmin || isHeadOfficeAdmin) && !resolveSubmissionSchoolId()) {
        return "Please select a school.";
      }
      if (isSuperAdmin && !String(form.headOfficeId || "").trim()) {
        return "Please select a head office.";
      }
      if (!String(form.name || "").trim()) return "Name is required.";
      if (!String(form.phone || "").trim()) return "Phone is required.";
      if (!String(form.gender || "").trim()) return "Gender is required.";
      if (!String(form.birthDate || "").trim()) return "Birth date is required.";
    }

    if (step === 2) {
      if (!String(form.username || "").trim()) return "Username is required.";
      if (!isEditMode && !String(form.password || "").trim()) {
        return "Password is required.";
      }
      if (!String(form.designationId || "").trim()) {
        return "Designation is required.";
      }
      if (!String(form.joiningDate || "").trim()) {
        return "Joining date is required.";
      }
    }

    return "";
  };

  const save = async () => {
    if (saving) return;

    const message = validateForm();

    if (message) {
      setError(message);
      return;
    }

    const schoolId = resolveSubmissionSchoolId();

    setSaving(true);
    setError("");

    try {
      const payload = buildPayload(form, schoolId, !isEditMode);

      if (isEditMode && String(form.password || "").trim()) {
        payload.password = String(form.password).trim();
      }

      if (isEditMode) {
        await updateEmployee(editingId, payload, {
          photo: form.photo,
          resume: form.resume,
        });
      } else {
        await createEmployee(payload, {
          photo: form.photo,
          resume: form.resume,
        });
      }

      setSuccess(true);

      setTimeout(() => {
        onNavigate?.("manage-employee");
      }, 900);
    } catch (e) {
      setError(
        e?.message ||
          (isEditMode
            ? "Failed to update employee"
            : "Failed to create employee"),
      );
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <>
          <p className="avm-section-title">School & Basic Information</p>

          <div className="row g-20">
            {isSuperAdmin ? (
              <div className="col-12">
                <ManualScopeSelectors
                  enabled={isSuperAdmin}
                  headOffices={headOffices}
                  schoolOptions={manualScope.schoolOptions}
                  selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                  selectedSchoolId={form.schoolId}
                  onHeadOfficeChange={(value) => {
                    manualScope.setSelectedScope(value, "");
                    setForm((prev) => ({
                      ...prev,
                      headOfficeId: value,
                      schoolId: "",
                      designationId: "",
                      role: "",
                    }));
                  }}
                  onSchoolChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      schoolId: value,
                      designationId: "",
                      salaryGrade: "",
                      role: "",
                    }))
                  }
                  compact
                />
              </div>
            ) : (
              <div className="col-12 avm-grid">
                <FormField label="Head Office" required full>
                  <input
                    className="form-control avm-input ps-44"
                    value={
                      formHeadOfficeName ||
                      `Head Office ${authHeadOfficeId ?? ""}`
                    }
                    readOnly
                  />
                </FormField>

                {!isSuperAdmin && isHeadOfficeAdmin ? (
                  <FormField label="School Name" required full>
                    <select
                      className="form-select avm-input ps-44"
                      value={form.schoolId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          schoolId: e.target.value,
                          designationId: "",
                          salaryGrade: "",
                          role: "",
                        }))
                      }
                    >
                      <option value="">--Select School--</option>
                      {formSchools.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.schoolName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                ) : !isSuperAdmin ? (
                  <FormField label="School Name" required full>
                    <input
                      className="form-control avm-input ps-44"
                      value={
                        currentSchoolOption?.schoolName ||
                        formSchoolName ||
                        `School ${authSchoolId ?? ""}`
                      }
                      readOnly
                    />
                  </FormField>
                ) : null}
              </div>
            )}

            <div className="col-12 avm-grid">
            <FormField label="Name" required>
              <input
                type="text"
                className="form-control avm-input ps-44"
                placeholder="Enter name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </FormField>

            <FormField label="National ID">
              <input
                type="text"
                className="form-control avm-input ps-44"
                placeholder="Enter national ID"
                value={form.nationalId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nationalId: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Role" required>
              <select
                className="form-select avm-input ps-44"
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                    designationId: "",
                  }))
                }
                disabled={!formSchoolId}
              >
                <option value="">--Select--</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {formatRoleLabel(item)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Designation" required>
              <select
                className="form-select avm-input ps-44"
                value={form.designationId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    designationId: e.target.value,
                  }))
                }
                disabled={!formSchoolId || !String(form.role || "").trim()}
              >
                <option value="">
                  {!formSchoolId
                    ? "--Select school first--"
                    : !String(form.role || "").trim()
                      ? "--Select role first--"
                      : designations.length === 0
                        ? "--No designations found--"
                        : "--Select--"}
                </option>
                {designations.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Phone number" required noIcon>
              <PhoneCodeField
                id="phone"
                label=""
                required
                value={form.phone}
                onChange={(fullValue) =>
                  setForm((prev) => ({ ...prev, phone: fullValue }))
                }
              />
            </FormField>

            <FormField label="Gender" required>
              <select
                className="form-select avm-input ps-44"
                value={form.gender}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gender: e.target.value }))
                }
              >
                <option value="">--Select--</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </FormField>

            <FormField label="Blood Group">
              <select
                className="form-select avm-input ps-44"
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    bloodGroup: e.target.value,
                  }))
                }
              >
                <option value="">--Select--</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </FormField>

            <FormField label="Religion">
              <input
                type="text"
                className="form-control avm-input ps-44"
                placeholder="Enter religion"
                value={form.religion}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    religion: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Birth Date" required>
              <input
                type="date"
                className="form-control avm-input ps-44"
                value={form.birthDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    birthDate: e.target.value,
                  }))
                }
              />
            </FormField>
            </div>
          </div>
        </>
      );
    }

    if (activeStep === 1) {
      return (
        <>
          <p className="avm-section-title">Address Information</p>

          <div className="row g-20">
            <div className="col-12 avm-grid">
            <FormField label="Present Address" full>
              <textarea
                rows="3"
                className="form-control avm-input ps-44"
                placeholder="Enter present address"
                value={form.presentAddress}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    presentAddress: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Permanent Address" full>
              <textarea
                rows="3"
                className="form-control avm-input ps-44"
                placeholder="Enter permanent address"
                value={form.permanentAddress}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    permanentAddress: e.target.value,
                  }))
                }
              />
            </FormField>
            </div>
          </div>
        </>
      );
    }

    if (activeStep === 2) {
      return (
        <>
          <p className="avm-section-title">Academic Information</p>

          <div className="row g-20">
            <div className="col-12 avm-grid">
            <FormField label="Email">
              <input
                type="email"
                className="form-control avm-input ps-44"
                placeholder="Enter email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </FormField>

            <FormField label="Username" required>
              <input
                type="text"
                className="form-control avm-input ps-44"
                placeholder="Enter username"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Password" required={!isEditMode}>
              <input
                type="password"
                className="form-control avm-input ps-44"
                placeholder={
                  isEditMode
                    ? "Leave blank to keep existing password"
                    : "Enter password"
                }
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Salary Grade" required>
              <select
                className="form-select avm-input ps-44"
                value={form.salaryGrade}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    salaryGrade: e.target.value,
                  }))
                }
                disabled={!formSchoolId || salaryGradeLoading}
              >
                <option value="">
                  {!formSchoolId
                    ? "--Select school first--"
                    : salaryGradeLoading
                      ? "Loading..."
                      : "--Select--"}
                </option>

                {salaryGrades.map((grade) => (
                  <option key={grade.id} value={grade.gradeName}>
                    {grade.gradeName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Salary Type" required>
              <select
                className="form-select avm-input ps-44"
                value={form.salaryType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    salaryType: e.target.value,
                  }))
                }
              >
                <option value="">--Select--</option>
                <option>Monthly</option>
                <option>Hourly</option>
              </select>
            </FormField>

            <FormField label="Joining Date" required>
              <input
                type="date"
                className="form-control avm-input ps-44"
                value={form.joiningDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    joiningDate: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Resume" full noIcon>
              <input
                type="file"
                className="form-control avm-input ps-44"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={(e) => handleFileChange(e, "resume")}
                style={{ padding: "0.45rem 1rem" }}
              />

              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#7a8a9a",
                  marginTop: 4,
                }}
              >
                File format: .pdf, .doc/docx, .ppt/pptx or .txt
              </span>
            </FormField>
            </div>
          </div>
        </>
      );
    }

    if (activeStep === 3) {
      return (
        <>
          <p className="avm-section-title">Other Information</p>

          <div className="row g-20">
            <div className="col-12 avm-grid">
            <FormField label="Is View on Web?">
              <select
                className="form-select avm-input ps-44"
                value={form.isViewOnWeb}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isViewOnWeb: e.target.value,
                  }))
                }
              >
                <option value="">--Select--</option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </FormField>

            <FormField label="Facebook URL">
              <input
                type="url"
                className="form-control avm-input ps-44"
                placeholder="https://facebook.com/..."
                value={form.facebookUrl}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    facebookUrl: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="LinkedIn URL">
              <input
                type="url"
                className="form-control avm-input ps-44"
                placeholder="https://linkedin.com/..."
                value={form.linkedinUrl}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    linkedinUrl: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Twitter URL">
              <input
                type="url"
                className="form-control avm-input ps-44"
                placeholder="https://twitter.com/..."
                value={form.twitterUrl}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    twitterUrl: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Instagram URL">
              <input
                type="url"
                className="form-control avm-input ps-44"
                placeholder="https://instagram.com/..."
                value={form.instagramUrl}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    instagramUrl: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Youtube URL">
              <input
                type="url"
                className="form-control avm-input ps-44"
                placeholder="https://youtube.com/..."
                value={form.youtubeUrl}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    youtubeUrl: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Pinterest URL">
              <input
                type="url"
                className="form-control avm-input ps-44"
                placeholder="https://pinterest.com/..."
                value={form.pinterestUrl}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    pinterestUrl: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Other Info" full>
              <input
                type="text"
                className="form-control avm-input ps-44"
                placeholder="Any other info"
                value={form.otherInfo}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    otherInfo: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Photo" full noIcon>
              <input
                ref={photoRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, "photo")}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-light border d-flex align-items-center gap-8"
                  onClick={() => photoRef.current?.click()}
                >
                  <i className="ri-upload-2-line"></i> Upload Photo
                </button>

                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="preview"
                    style={{
                      width: 60,
                      height: 65,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #d0d5dd",
                    }}
                  />
                ) : null}
              </div>

              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#7a8a9a",
                  marginTop: 4,
                }}
              >
                Max-W: 120px, Max-H: 130px - .jpg, .jpeg, .png or .gif
              </span>
            </FormField>
            </div>
          </div>

        </>
      );
    }

    return null;
  };

  const stepTabs = (
    <div className="d-flex flex-wrap gap-0 border-bottom border-neutral-200 mb-20">
      {STEPS.map((step, index) => (
        <button
          key={step}
          type="button"
          className="border-0 bg-transparent"
          onClick={() => {
            if (index > activeStep) {
              const err = validateStep(activeStep);
              if (err) {
                setError(err);
                return;
              }
            }

            setError("");
            setActiveStep(index);
          }}
          style={{
            borderBottom:
              activeStep === index
                ? "2px solid var(--primary-600, #4f46e5)"
                : "2px solid transparent",
            color:
              activeStep === index
                ? "var(--primary-600, #4f46e5)"
                : "var(--text-secondary-light, #667085)",
            fontWeight: activeStep === index ? 600 : 500,
            padding: "14px 20px",
            fontSize: "0.875rem",
          }}
        >
          {step}
        </button>
      ))}
    </div>
  );

  const footer = (
    <>
      <button
        type="button"
        className="btn btn-light border px-24"
        onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
        disabled={activeStep === 0}
      >
        Back
      </button>

      <div className="d-flex align-items-center gap-10">
        <button
          type="button"
          className="btn btn-light border px-24"
          onClick={() => onNavigate?.("manage-employee")}
        >
          Cancel
        </button>

        {activeStep < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary-600 px-24"
            onClick={() => {
              const err = validateStep(activeStep);
              if (err) {
                setError(err);
                return;
              }

              setError("");
              setActiveStep((step) => Math.min(STEPS.length - 1, step + 1));
            }}
          >
            Next
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
                <i className="ri-save-line"></i>{" "}
                {isEditMode ? "Update" : "Save"} Employee
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <SingleStepFormShell
      title={`${isEditMode ? "Edit" : "Add"} Employee`}
      breadcrumbTrail={` / Manage Employee / ${isEditMode ? "Edit" : "Add"}`}
      onDashboard={() => onNavigate?.("dashboard")}
      onBack={() => onNavigate?.("manage-employee")}
      stepLabel={STEPS[activeStep]}
      error={error}
      success={success}
      successMessage={`Employee ${isEditMode ? "updated" : "created"} successfully! Redirecting...`}
      footer={footer}
    >
      {stepTabs}
      <div className="tab-content">{renderStep()}</div>
      <div className="row g-20 mt-16">
        <div className="col-12 avm-grid">
          <div
            className="full"
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "0.5rem",
              padding: "0.65rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i
              className="ri-information-line"
              style={{
                color: "#d97706",
                fontSize: "1rem",
                flexShrink: 0,
              }}
            ></i>
            <span style={{ fontSize: "0.82rem", color: "#92400e" }}>
              Roles load after a school is selected, and designations load after a role is selected.
            </span>
          </div>
        </div>
      </div>
    </SingleStepFormShell>
  );
};

export default AddManageEmployee;
