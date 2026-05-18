import { useCallback, useEffect, useMemo, useState } from "react";
import { createOpeningHour, updateOpeningHour } from "../apis/openingHourApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesPage } from "../apis/headOfficesApi";
import ManualScopeSelectors from "../components/ManualScopeSelectors";
import { useAuth } from "../context/useAuth";
import { useSchool } from "../context/useSchool";

const EDIT_STORAGE_KEY = "edit-opening-hour-row";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const OpeningHourCreate = ({ onNavigate }) => {
  const {
    role,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
    headOfficeId: authHeadOfficeId,
    headOfficeName: authHeadOfficeName,
    status: authStatus,
  } = useAuth();
  const { activeSchoolId } = useSchool();

  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";
  const isHeadOfficeAdmin = String(role || "").toUpperCase() === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = String(role || "").toUpperCase() === "SCHOOL_ADMIN";
  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};

  const [editId, setEditId] = useState(null);
  const [schools, setSchools] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    schoolId: "",
    status: true,
    
    mondayEnabled: false,
    mondayStart: "09:00",
    mondayEnd: "17:00",

    tuesdayEnabled: false,
    tuesdayStart: "09:00",
    tuesdayEnd: "17:00",

    wednesdayEnabled: false,
    wednesdayStart: "09:00",
    wednesdayEnd: "17:00",

    thursdayEnabled: false,
    thursdayStart: "09:00",
    thursdayEnd: "17:00",

    fridayEnabled: false,
    fridayStart: "09:00",
    fridayEnd: "17:00",

    saturdayEnabled: false,
    saturdayStart: "09:00",
    saturdayEnd: "17:00",

    sundayEnabled: false,
    sundayStart: "09:00",
    sundayEnd: "17:00",
  });

  const loadSchools = useCallback(async () => {
    try {
      const data = await fetchSchoolsLookup();
      setSchools(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }, []);

  const loadHeadOffices = useCallback(async () => {
    try {
      const data = await fetchHeadOfficesPage(0, 500);
      setHeadOffices(Array.isArray(data?.content) ? data.content : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    void loadHeadOffices();
  }, [isSuperAdmin, loadHeadOffices]);

  const currentSchoolOption = useMemo(() => {
    if (!authSchoolId) return null;
    return {
      id: authSchoolId,
      schoolName: authSchoolName || `School ${authSchoolId}`,
      headOfficeId: authHeadOfficeId ?? null,
    };
  }, [authHeadOfficeId, authSchoolId, authSchoolName]);

  const schoolOptions = useMemo(() => {
    if (isSchoolAdmin) {
      return currentSchoolOption ? [currentSchoolOption] : [];
    }

    if (isHeadOfficeAdmin) {
      const targetHeadOfficeId = authHeadOfficeId != null ? String(authHeadOfficeId) : "";
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? "") === targetHeadOfficeId)
        .sort((a, b) => String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")));
    }

    if (selectedHeadOfficeId) {
      return [...schools]
        .filter((school) => String(school?.headOfficeId ?? "") === String(selectedHeadOfficeId))
        .sort((a, b) => String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")));
    }

    return [...schools].sort((a, b) => String(a?.schoolName || "").localeCompare(String(b?.schoolName || "")));
  }, [authHeadOfficeId, currentSchoolOption, isHeadOfficeAdmin, isSchoolAdmin, schools, selectedHeadOfficeId]);

  const scopeLabel = useMemo(() => {
    if (isSchoolAdmin) {
      return `School scope: ${authSchoolName || `School ${authSchoolId}`}`;
    }

    if (isHeadOfficeAdmin) {
      return `Head office scope: ${authHeadOfficeName || `Head Office ${authHeadOfficeId}`}`;
    }

    if (selectedHeadOfficeId) {
      const selectedHeadOffice = headOffices.find((ho) => String(ho.id) === String(selectedHeadOfficeId));
      const selectedSchool = schoolOptions.find((school) => String(school.id) === String(formData.schoolId));
      return `Scope: ${selectedHeadOffice?.name || `Head Office ${selectedHeadOfficeId}`} / ${selectedSchool?.schoolName || "Select school"}`;
    }

    return "Super admin scope: all schools";
  }, [
    authHeadOfficeId,
    authHeadOfficeName,
    authSchoolId,
    authSchoolName,
    headOffices,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    selectedHeadOfficeId,
    schoolOptions,
    formData.schoolId,
  ]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    if (isSchoolAdmin && authSchoolId) {
      setFormData((prev) => ({ ...prev, schoolId: String(authSchoolId) }));
    } else if (isHeadOfficeAdmin && authHeadOfficeId != null) {
      setSelectedHeadOfficeId(String(authHeadOfficeId));
    } else if (activeSchoolId) {
      setFormData((prev) => ({ ...prev, schoolId: String(activeSchoolId) }));
    }

    try {
      const stored = sessionStorage.getItem(EDIT_STORAGE_KEY);
      if (stored) {
        const row = JSON.parse(stored);
        if (row && row.id) {
          setEditId(row.id);
          setFormData({
            schoolId: row.schoolId ? String(row.schoolId) : "",
            status: row.status ?? true,

            mondayEnabled: row.mondayEnabled ?? false,
            mondayStart: row.mondayStart || "09:00",
            mondayEnd: row.mondayEnd || "17:00",

            tuesdayEnabled: row.tuesdayEnabled ?? false,
            tuesdayStart: row.tuesdayStart || "09:00",
            tuesdayEnd: row.tuesdayEnd || "17:00",

            wednesdayEnabled: row.wednesdayEnabled ?? false,
            wednesdayStart: row.wednesdayStart || "09:00",
            wednesdayEnd: row.wednesdayEnd || "17:00",

            thursdayEnabled: row.thursdayEnabled ?? false,
            thursdayStart: row.thursdayStart || "09:00",
            thursdayEnd: row.thursdayEnd || "17:00",

            fridayEnabled: row.fridayEnabled ?? false,
            fridayStart: row.fridayStart || "09:00",
            fridayEnd: row.fridayEnd || "17:00",

            saturdayEnabled: row.saturdayEnabled ?? false,
            saturdayStart: row.saturdayStart || "09:00",
            saturdayEnd: row.saturdayEnd || "17:00",

            sundayEnabled: row.sundayEnabled ?? false,
            sundayStart: row.sundayStart || "09:00",
            sundayEnd: row.sundayEnd || "17:00",
          });
        }
      }
    } catch {
      // ignore
    }
  }, [activeSchoolId, authHeadOfficeId, authSchoolId, authStatus, isHeadOfficeAdmin, isSchoolAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!formData.schoolId) {
      setError("Please select a school");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        schoolId: Number(formData.schoolId),
        status: formData.status,

        mondayEnabled: formData.mondayEnabled,
        mondayStart: formData.mondayEnabled ? formData.mondayStart : null,
        mondayEnd: formData.mondayEnabled ? formData.mondayEnd : null,

        tuesdayEnabled: formData.tuesdayEnabled,
        tuesdayStart: formData.tuesdayEnabled ? formData.tuesdayStart : null,
        tuesdayEnd: formData.tuesdayEnabled ? formData.tuesdayEnd : null,

        wednesdayEnabled: formData.wednesdayEnabled,
        wednesdayStart: formData.wednesdayEnabled ? formData.wednesdayStart : null,
        wednesdayEnd: formData.wednesdayEnabled ? formData.wednesdayEnd : null,

        thursdayEnabled: formData.thursdayEnabled,
        thursdayStart: formData.thursdayEnabled ? formData.thursdayStart : null,
        thursdayEnd: formData.thursdayEnabled ? formData.thursdayEnd : null,

        fridayEnabled: formData.fridayEnabled,
        fridayStart: formData.fridayEnabled ? formData.fridayStart : null,
        fridayEnd: formData.fridayEnabled ? formData.fridayEnd : null,

        saturdayEnabled: formData.saturdayEnabled,
        saturdayStart: formData.saturdayEnabled ? formData.saturdayStart : null,
        saturdayEnd: formData.saturdayEnabled ? formData.saturdayEnd : null,

        sundayEnabled: formData.sundayEnabled,
        sundayStart: formData.sundayEnabled ? formData.sundayStart : null,
        sundayEnd: formData.sundayEnabled ? formData.sundayEnd : null,
      };

      if (editId) {
        await updateOpeningHour(editId, payload);
      } else {
        await createOpeningHour(payload);
      }

      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY);
      } catch {
        // ignore
      }

      navigateTo("opening-hour");
    } catch (err) {
      setError(err?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    try {
      sessionStorage.removeItem(EDIT_STORAGE_KEY);
    } catch {
      // ignore
    }
    navigateTo("opening-hour");
  };

  return (
    <div className="dashboard-main-body">
      {/* Header & Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editId ? "Edit Opening Hour" : "Add Opening Hour"}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / </span>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={handleCancel}
            >
              Opening Hour
            </button>
            <span className="text-secondary-light text-sm">
              {" "}
              / {editId ? "Edit" : "Add"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-20">
          <i className="ri-error-warning-line text-lg"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="card border border-neutral-200">
        <div className="card-header px-20 py-16 border-bottom border-neutral-200 bg-neutral-50">
          <h6 className="card-title mb-0 text-primary-light">
            {editId ? "Edit Timing Configuration" : "New Timing Configuration"}
          </h6>
        </div>
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="alert alert-info d-flex align-items-center gap-8 mb-24">
              <i className="ri-information-line"></i>
              <span>{scopeLabel}</span>
            </div>

            <div className="row g-24 mb-24">
              <div className="col-12">
                <ManualScopeSelectors
                  enabled={!isSchoolAdmin}
                  headOffices={headOffices}
                  schoolOptions={schoolOptions}
                  selectedHeadOfficeId={selectedHeadOfficeId}
                  onHeadOfficeChange={(value) => {
                    setSelectedHeadOfficeId(value);
                    setFormData((prev) => ({ ...prev, schoolId: "" }));
                  }}
                  selectedSchoolId={formData.schoolId}
                  onSchoolChange={(value) => setFormData((prev) => ({ ...prev, schoolId: value }))}
                  showSchoolSelector={true}
                  showHeadOfficeSelector={isSuperAdmin}
                />
              </div>

              {isSchoolAdmin ? (
                <div className="col-md-6">
                  <label className="form-label text-sm fw-medium text-secondary-light">
                    School Name <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control border border-neutral-300 radius-8 text-secondary-light"
                    value={currentSchoolOption?.schoolName || "Linked school"}
                    disabled
                  />
                </div>
              ) : null}

              {/* Status Switch */}
              <div className="col-md-6 d-flex align-items-center mt-2">
                <div className="form-check form-switch p-0 d-flex align-items-center gap-10 mb-0">
                  <input
                    className="form-check-input ms-0 cursor-pointer"
                    type="checkbox"
                    role="switch"
                    id="statusSwitch"
                    checked={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.checked }))
                    }
                    style={{ width: "48px", height: "24px" }}
                  />
                  <label
                    className="form-check-label text-sm fw-medium text-secondary-light cursor-pointer mt-0"
                    htmlFor="statusSwitch"
                  >
                    Active Status
                  </label>
                </div>
              </div>
            </div>

            <hr className="my-24 border-neutral-200" />

            <h6 className="text-primary-light mb-16 text-sm">Opening Hours Grid</h6>

            {/* Timing Grid */}
            <div className="d-flex flex-column gap-16">
              {DAYS_OF_WEEK.map((day) => {
                const isEnabled = formData[`${day.key}Enabled`];
                return (
                  <div
                    key={day.key}
                    className="row align-items-center border border-neutral-200 rounded-8 p-12 bg-white"
                  >
                    {/* Checkbox to Enable Day */}
                    <div className="col-md-3 d-flex align-items-center gap-10">
                      <input
                        type="checkbox"
                        className="form-check-input cursor-pointer"
                        id={`${day.key}Checkbox`}
                        checked={isEnabled}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [`${day.key}Enabled`]: e.target.checked,
                          }))
                        }
                      />
                      <label
                        className="form-check-label fw-semibold text-primary-light cursor-pointer mb-0 text-sm"
                        htmlFor={`${day.key}Checkbox`}
                      >
                        {day.label}
                      </label>
                    </div>

                    {/* Start Time */}
                    <div className="col-md-4">
                      <div className="d-flex align-items-center gap-8">
                        <span className="text-xs text-secondary-light">Start Time:</span>
                        <input
                          type="time"
                          className="form-control border border-neutral-300 radius-8 text-secondary-light text-sm"
                          value={formData[`${day.key}Start`]}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [`${day.key}Start`]: e.target.value,
                            }))
                          }
                          disabled={!isEnabled}
                        />
                      </div>
                    </div>

                    {/* <=> Divider */}
                    <div className="col-md-1 text-center text-secondary-light text-lg">
                      &lt;=&gt;
                    </div>

                    {/* End Time */}
                    <div className="col-md-4">
                      <div className="d-flex align-items-center gap-8">
                        <span className="text-xs text-secondary-light">End Time:</span>
                        <input
                          type="time"
                          className="form-control border border-neutral-300 radius-8 text-secondary-light text-sm"
                          value={formData[`${day.key}End`]}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [`${day.key}End`]: e.target.value,
                            }))
                          }
                          disabled={!isEnabled}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="d-flex align-items-center gap-12 mt-32 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-neutral-300 px-24 py-12 radius-8 text-sm"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-24 py-12 radius-8 text-sm d-flex align-items-center gap-8"
                disabled={saving}
              >
                {saving && (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                )}
                <span>{editId ? "Update Configuration" : "Save Configuration"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OpeningHourCreate;
