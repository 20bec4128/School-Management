import { useEffect, useMemo, useState } from "react";
import "../assets/css/addModalShared.css";

import { useAuth } from "../context/useAuth";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchSchoolRoles } from "../apis/schoolRbacApi";
import { createDesignation, updateDesignation } from "../apis/designationsApi";
import SingleStepFormShell from "../components/SingleStepFormShell";
import { normalizeRole } from "../utils/roles";

const EDIT_STORAGE_KEY = "edit-designation-row";
const STEPS = ["Basic Information"];

const emptyForm = {
  headOfficeId: "",
  schoolId: "",
  designationId: null,
  role: "",
  designation: "",
  note: "",
};

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  Role: "ri-shield-user-line",
  Designation: "ri-award-line",
  Note: "ri-sticky-note-line",
};

const formatRoleLabel = (value) => {
  const v = String(value || "")
    .trim()
    .toUpperCase()
    .replaceAll("_", " ");
  return v ? v.replace(/\b\w/g, (m) => m.toUpperCase()) : "";
};

const normalizeRoleValue = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[- ]+/g, "_")
    .replaceAll("__", "_");
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
            <i className={icon} />
          </span>

          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

const AddManageDesignation = ({ onNavigate }) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    headOfficeName,
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

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const editingId = initialEditRow?.id ?? null;

  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [roles, setRoles] = useState([]);

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        designationId: initialEditRow?.id ?? null,
        schoolId:
          initialEditRow?.schoolId != null
            ? String(initialEditRow.schoolId)
            : "",
        role: initialEditRow?.role ?? "",
        designation: initialEditRow?.designation ?? "",
        note: initialEditRow?.note ?? "",
      };
    }

    const base = { ...emptyForm };

    if (isSchoolAdmin) {
      base.schoolId = authSchoolId != null ? String(authSchoolId) : "";
      base.headOfficeId =
        authHeadOfficeId != null ? String(authHeadOfficeId) : "";
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId =
        authHeadOfficeId != null ? String(authHeadOfficeId) : "";
    }

    return base;
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeStep] = useState(0);

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  const schoolsById = useMemo(() => {
    const map = new Map();

    for (const school of Array.isArray(schools) ? schools : []) {
      if (school?.id == null) continue;
      map.set(String(school.id), school);
    }

    return map;
  }, [schools]);

  const headOfficesById = useMemo(() => {
    const map = new Map();

    for (const headOffice of Array.isArray(headOffices) ? headOffices : []) {
      if (headOffice?.id == null) continue;
      map.set(String(headOffice.id), headOffice);
    }

    return map;
  }, [headOffices]);

  const resolveHeadOfficeName = (headOfficeId) => {
    if (headOfficeId == null) return "";
    const row = headOfficesById.get(String(headOfficeId));
    return row?.name || "";
  };

  const resolveSchoolName = (schoolId, fallbackName = "") => {
    if (schoolId == null) return "";
    const row = schoolsById.get(String(schoolId));
    return row?.schoolName || row?.name || fallbackName || "";
  };

  const loadRolesForSchool = async (schoolId) => {
    if (schoolId == null || String(schoolId).trim() === "") {
      setRoles([]);
      return;
    }

    try {
      const data = await fetchSchoolRoles({
        schoolId: Number(schoolId),
      });

      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setRoles([]);
    }
  };

  const loadLookups = async () => {
    setLoading(true);

    try {
      const tasks = [];

      if (isSuperAdmin) {
        tasks.push(
          fetchHeadOfficesPage(0, 500)
            .then((page) => {
              const content = Array.isArray(page?.content) ? page.content : [];
              setHeadOffices(content);
            })
            .catch(() => setHeadOffices([])),
        );
      }

      if (!isSchoolAdmin) {
        tasks.push(
          fetchSchoolsLookup()
            .then((list) => setSchools(Array.isArray(list) ? list : []))
            .catch(() => setSchools([])),
        );
      } else {
        setSchools([]);
      }

      await Promise.all(tasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "ready" || !token) return;
    void loadLookups();
  }, [status, token, role]);

  useEffect(() => {
    if (!initialEditRow || schools.length === 0) return;

    const school =
      initialEditRow.schoolId != null
        ? schoolsById.get(String(initialEditRow.schoolId))
        : null;

    const headOfficeId = (() => {
      const ho = school?.headOfficeId ?? null;
      if (ho != null) return String(ho);
      if (authHeadOfficeId != null) return String(authHeadOfficeId);
      return "";
    })();

    setForm((prev) => ({
      ...prev,
      headOfficeId,
      schoolId:
        initialEditRow?.schoolId != null ? String(initialEditRow.schoolId) : "",
    }));
  }, [initialEditRow, schools, schoolsById, authHeadOfficeId]);

  useEffect(() => {
    if (form.schoolId) {
      void loadRolesForSchool(form.schoolId);
    } else if (isSchoolAdmin && authSchoolId) {
      void loadRolesForSchool(authSchoolId);
    } else {
      setRoles([]);
    }
  }, [form.schoolId, isSchoolAdmin, authSchoolId]);

  const schoolOptionsForForm = useMemo(() => {
    if (isSchoolAdmin) return [];

    const selectedHeadOfficeId = isSuperAdmin
      ? form.headOfficeId
      : authHeadOfficeId != null
        ? String(authHeadOfficeId)
        : "";

    const list = Array.isArray(schools) ? schools : [];

    if (!selectedHeadOfficeId) return list;

    return list.filter(
      (school) =>
        String(school?.headOfficeId ?? "") === String(selectedHeadOfficeId),
    );
  }, [
    schools,
    authHeadOfficeId,
    isSchoolAdmin,
    isSuperAdmin,
    form.headOfficeId,
  ]);

  const handleChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      [id]: value,
      ...(id === "schoolId" ? { role: "", designation: prev.designation } : {}),
    }));

    if (id === "schoolId") {
      void loadRolesForSchool(value);
    }
  };

  const handleHeadOfficeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      headOfficeId: value,
      schoolId: "",
      role: "",
    }));

    setRoles([]);
  };

  const validate = () => {
    if (isSuperAdmin && !String(form.headOfficeId || "").trim()) {
      return "Head office is required.";
    }

    const effectiveSchoolId = isSchoolAdmin
      ? authSchoolId
      : form.schoolId
        ? Number(form.schoolId)
        : null;

    if (!effectiveSchoolId) return "School is required.";

    const roleValue = normalizeRoleValue(form.role);
    if (!roleValue) return "Role is required.";

    const name = String(form.designation || "").trim();
    if (!name) return "Designation name is required.";

    return "";
  };

  const save = async () => {
    const message = validate();

    if (message) {
      setError(message);
      return;
    }

    const effectiveSchoolId = isSchoolAdmin
      ? authSchoolId
      : form.schoolId
        ? Number(form.schoolId)
        : null;

    const payload = {
      schoolId: effectiveSchoolId,
      role: normalizeRoleValue(form.role),
      name: String(form.designation || "").trim(),
      note: form.note || "",
    };

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateDesignation(editingId, payload);
      } else {
        await createDesignation(payload);
      }

      setSuccess(true);

      setTimeout(() => {
        onNavigate?.("manage-designation");
      }, 900);
    } catch (e) {
      setError(
        e?.message ||
          (editingId
            ? "Failed to update designation"
            : "Failed to create designation"),
      );
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (activeStep !== 0) return null;

    return (
      <div className="row g-20">
        <div className="col-12 avm-grid">
          {isSuperAdmin ? (
            <FormField label="Head Office" required>
              <select
                className="form-select avm-input ps-44"
                value={form.headOfficeId}
                onChange={(e) => handleHeadOfficeChange(e.target.value)}
              >
                <option value="">Select Head Office</option>
                {headOffices.map((headOffice) => (
                  <option key={headOffice.id} value={String(headOffice.id)}>
                    {headOffice.name}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          {isHeadOfficeAdmin && !isSuperAdmin ? (
            <FormField label="Head Office" required>
              <input
                className="form-control avm-input ps-44"
                value={
                  headOfficeName ||
                  resolveHeadOfficeName(authHeadOfficeId) ||
                  ""
                }
                readOnly
              />
            </FormField>
          ) : null}

          {isSuperAdmin || isHeadOfficeAdmin ? (
            <FormField label="School Name" required>
              <select
                className="form-select avm-input ps-44"
                value={form.schoolId}
                onChange={(e) => handleChange("schoolId", e.target.value)}
                disabled={isSuperAdmin && !form.headOfficeId}
              >
                <option value="">
                  {isSuperAdmin && !form.headOfficeId
                    ? "Select Head Office First"
                    : "Select School"}
                </option>

                {schoolOptionsForForm.map((school) => (
                  <option key={school.id} value={String(school.id)}>
                    {school.schoolName || school.name}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          {isSchoolAdmin ? (
            <FormField label="School Name" required>
              <input
                className="form-control avm-input ps-44"
                value={
                  authSchoolName ||
                  resolveSchoolName(authSchoolId, authSchoolName) ||
                  ""
                }
                readOnly
              />
            </FormField>
          ) : null}

          <FormField label="Role" required>
            <select
              className="form-select avm-input ps-44"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              disabled={!form.schoolId && !isSchoolAdmin}
            >
              <option value="">Select Role</option>
              {roles.map((item) => (
                <option key={item.name} value={item.name}>
                  {formatRoleLabel(item.name)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Designation" required>
            <input
              type="text"
              className="form-control avm-input ps-44"
              placeholder="Enter designation"
              value={form.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
            />
          </FormField>

          <FormField label="Note" full>
            <textarea
              rows="4"
              className="form-control avm-input ps-44"
              placeholder="Enter note"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
            />
          </FormField>
        </div>
      </div>
    );
  };

  return (
    <SingleStepFormShell
      title={`${editingId ? "Edit" : "Add"} Designation`}
      breadcrumbTrail={` / Manage Designation / ${editingId ? "Edit" : "Add"}`}
      onDashboard={() => onNavigate?.("dashboard")}
      onBack={() => onNavigate?.("manage-designation")}
      backLabel="Back to List"
      stepLabel={STEPS[0]}
      error={error}
      success={success}
      successMessage={`Designation ${editingId ? "updated" : "created"} successfully! Redirecting...`}
      footer={
        <>
          <button
            type="button"
            className="btn btn-light border px-24"
            onClick={() => onNavigate?.("manage-designation")}
          >
            Cancel
          </button>

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
                <i className="ri-save-line" /> {editingId ? "Update" : "Save"}{" "}
                Designation
              </>
            )}
          </button>
        </>
      }
    >
      {renderStep()}
    </SingleStepFormShell>
  );
};

export default AddManageDesignation;
