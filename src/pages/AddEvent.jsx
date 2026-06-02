import { useEffect, useMemo, useRef, useState } from "react";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";
import { createEvent, updateEvent } from "../apis/eventApi";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "event-edit-row";

const emptyForm = {
  schoolId: "",
  title: "",
  eventFor: "",
  eventPlace: "",
  fromDate: "",
  toDate: "",
  image: "",
  note: "",
  isViewOnWeb: "",
};

const eventForOptions = ["Students", "Parents", "Staff", "All"];

const FormField = ({
  label,
  required,
  children,
  full = false,
  noIcon = false,
}) => (
  <div className={full ? "col-12 mb-20" : "col-md-6 mb-20"}>
    <label className="avm-label">
      {label}
      {required && <span className="req"> *</span>}
    </label>
    {!noIcon ? (
      <div className="avm-input-with-icon" style={{ position: "relative" }}>
        {children}
      </div>
    ) : (
      children
    )}
  </div>
);

const readEditRow = () => {
  try {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AddEvent = ({ onNavigate }) => {
  const {
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();
  const { activeSchoolId, schoolOptions: contextSchoolOptions } = useSchool();
  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const manualScope = useManualSchoolScope(isSuperAdmin);
  const photoRef = useRef(null);
  const [initialEditRow] = useState(() => readEditRow());
  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        ...initialEditRow,
        schoolId:
          initialEditRow.schoolId != null
            ? String(initialEditRow.schoolId)
            : "",
        isViewOnWeb: initialEditRow.isViewOnWeb ? "Yes" : "No",
      };
    }
    const listSchoolId = isSuperAdmin
      ? ""
      : activeSchoolId
        ? String(activeSchoolId)
        : authSchoolId
          ? String(authSchoolId)
          : "";
    return { ...emptyForm, schoolId: listSchoolId };
  });
  const [editingId] = useState(() => initialEditRow?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(() => initialEditRow?.image || "");

  useEffect(() => () => sessionStorage.removeItem(EDIT_STORAGE_KEY), []);

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin) return;
    const list = manualScope.schoolOptions.length > 0 ? manualScope.schoolOptions : contextSchoolOptions;
    if (list.length === 0) return;
    const school = list.find((item) => String(item?.id) === String(initialEditRow.schoolId));
    if (school?.headOfficeId != null) {
      manualScope.setSelectedScope(
        String(school.headOfficeId),
        String(initialEditRow.schoolId ?? ""),
      );
    }
  }, [contextSchoolOptions, initialEditRow, isSuperAdmin, manualScope]);

  const schoolOptions = useMemo(() => {
    const list = isSuperAdmin ? manualScope.schoolOptions : contextSchoolOptions;
    const fallback =
      form.schoolId &&
      authSchoolName &&
      !list.some((school) => String(school.id) === String(form.schoolId))
        ? [{ id: form.schoolId, schoolName: authSchoolName }]
        : [];
    return [...list, ...fallback];
  }, [
    contextSchoolOptions,
    form.schoolId,
    isSuperAdmin,
    manualScope.schoolOptions,
    authSchoolName,
  ]);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setForm((prev) => ({ ...prev, image: dataUrl }));
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    if (
      !form.schoolId ||
      !form.title ||
      !form.eventFor ||
      !form.eventPlace ||
      !form.fromDate ||
      !form.toDate
    ) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        schoolId: Number(form.schoolId),
        title: String(form.title || "").trim(),
        eventFor: String(form.eventFor || "").trim(),
        eventPlace: String(form.eventPlace || "").trim(),
        fromDate: form.fromDate || null,
        toDate: form.toDate || null,
        image: form.image || "",
        note: String(form.note || "").trim(),
        isViewOnWeb: form.isViewOnWeb === "Yes",
      };

      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }

      setSuccess(true);
      setTimeout(() => onNavigate("event"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? "Edit Event" : "Add Event"}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
            >
              Dashboard
            </button>
            <span className="text-secondary-light">
              {" "}
              / {editingId ? "Edit Event" : "Add Event"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate("event")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error ? (
        <div
          className="alert alert-danger d-flex align-items-center gap-8"
          role="alert"
        >
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div
          className="alert alert-success d-flex align-items-center gap-8"
          role="alert"
        >
          <i className="ri-checkbox-circle-line"></i>
          <span>
            Event {editingId ? "updated" : "saved"} successfully! Redirecting...
          </span>
        </div>
      ) : null}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {isSuperAdmin ? (
                <div className="col-12 mb-20">
                  <ManualScopeSelectors
                    enabled={isSuperAdmin}
                    headOffices={manualScope.headOffices}
                    schoolOptions={schoolOptions}
                    selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                    onHeadOfficeChange={(value) => {
                      manualScope.setSelectedHeadOfficeId(value);
                      manualScope.setSelectedSchoolId("");
                      setForm((prev) => ({ ...prev, schoolId: "" }));
                    }}
                    selectedSchoolId={form.schoolId}
                    onSchoolChange={(value) =>
                      setForm((prev) => ({ ...prev, schoolId: value }))
                    }
                    compact
                  />
                </div>
              ) : (
                <FormField label="School Name" required>
                  <select
                    id="schoolId"
                    className="form-control form-select"
                    value={form.schoolId}
                    onChange={handleChange}
                    style={{ paddingLeft: "2.5rem" }}
                    disabled={!isSuperAdmin && !!activeSchoolId}
                  >
                    <option value="">--Select School--</option>
                    {schoolOptions.map((school) => (
                      <option key={String(school.id)} value={String(school.id)}>
                        {school.schoolName}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Title" required>
                <input
                  type="text"
                  id="title"
                  className="form-control"
                  placeholder="Title"
                  value={form.title}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Event for" required>
                <select
                  id="eventFor"
                  className="form-control form-select"
                  value={form.eventFor}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                >
                  <option value="">--Select--</option>
                  {eventForOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Event Place" required>
                <input
                  type="text"
                  id="eventPlace"
                  className="form-control"
                  placeholder="Event Place"
                  value={form.eventPlace}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="From Date" required>
                <input
                  type="date"
                  id="fromDate"
                  className="form-control"
                  value={form.fromDate}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="To Date" required>
                <input
                  type="date"
                  id="toDate"
                  className="form-control"
                  value={form.toDate}
                  onChange={handleChange}
                />
              </FormField>

              <div className="col-12 mb-20">
                <label className="form-label fw-semibold text-primary-light mb-8 d-block">
                  Image
                </label>
                <input
                  ref={photoRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <button
                    type="button"
                    className="avm-btn light"
                    onClick={() => photoRef.current?.click()}
                  >
                    <i className="ri-upload-2-line"></i> Upload Image
                  </button>
                  {preview ? (
                    <img
                      src={preview}
                      alt="preview"
                      style={{
                        width: 80,
                        height: 54,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #d0d5dd",
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <FormField label="Note" full>
                <textarea
                  rows="4"
                  id="note"
                  className="form-control"
                  placeholder="Note"
                  value={form.note}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Is View on Web?" required full noIcon>
                <select
                  id="isViewOnWeb"
                  className="form-control form-select"
                  value={form.isViewOnWeb}
                  onChange={handleChange}
                >
                  <option value="">--Select--</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate("event")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update Event"
                    : "Save Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEvent;
