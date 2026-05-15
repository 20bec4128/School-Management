import React, { useState, useEffect } from "react";
import { createCallLog, updateCallLog } from "../apis/callLogApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";
import { useAuth } from "../context/useAuth";
import PhoneCodeField from "../components/PhoneCodeField";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "call-log-edit-row";
const DEFAULT_PHONE_CODE = "+91";

const splitPhoneValue = (fullValue) => {
  const trimmed = String(fullValue || "").trim();
  if (!trimmed) return { code: DEFAULT_PHONE_CODE, number: "" };
  if (!trimmed.startsWith("+")) return { code: DEFAULT_PHONE_CODE, number: trimmed.replace(/\D/g, "") };
  const parts = trimmed.split(/\s+/);
  return {
    code: parts[0] || DEFAULT_PHONE_CODE,
    number: parts.slice(1).join("").replace(/\D/g, ""),
  };
};

const emptyForm = {
  schoolId: "",
  name: "",
  phone: "",
  callDuration: "",
  date: new Date().toISOString().split("T")[0],
  followUpDate: "",
  callType: "Incoming",
  note: "",
};

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Name: "ri-user-3-line",
  "Phone Number": "ri-phone-line",
  "Call Duration": "ri-time-line",
  "Call Date": "ri-calendar-2-line",
  "Follow Up": "ri-calendar-check-line",
  Note: "ri-sticky-note-line",
  "Head Office": "ri-building-line",
};

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={full ? "col-12 mb-20" : "col-md-6 mb-20"}>
      <label className="form-label fw-semibold text-primary-light mb-8 d-block">
        {label} {required && <span className="text-danger-600">*</span>}
      </label>
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
    </div>
  );
};

const AddCallLog = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState("");
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);

  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";

  useEffect(() => {
    const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
    if (raw) {
      try {
        const row = JSON.parse(raw);
        const parsedPhone = splitPhoneValue(row.phone);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditingId(row.id);
        setPhoneCode(parsedPhone.code);
        setForm({
          schoolId: row.schoolId != null ? String(row.schoolId) : "",
          name: row.name || "",
          phone: parsedPhone.number,
          callDuration: row.callDuration || "",
          date: row.date || new Date().toISOString().split("T")[0],
          followUpDate: row.followUpDate || "",
          callType: row.callType || "Incoming",
          note: row.note || "",
        });
      } catch (e) {
        console.error("Failed to parse edit row", e);
      }
      sessionStorage.removeItem(EDIT_STORAGE_KEY);
    }
  }, []);

  // Load lookups
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [hoList, sList] = await Promise.all([
          fetchHeadOfficesLookup(),
          fetchSchoolsLookup(),
        ]);
        setHeadOffices(hoList || []);
        setSchools(sList || []);
      } catch (err) {
        console.error("Failed to load lookups", err);
      }
    };
    loadLookups();
  }, []);

  const filteredSchools = isSuperAdmin
    ? schools.filter((s) => !selectedHeadOfficeId || String(s.headOfficeId) === String(selectedHeadOfficeId))
    : schools;

  useEffect(() => {
    if (!isSuperAdmin || !editingId || schools.length === 0) return;
    const school = schools.find((s) => String(s.id) === String(form.schoolId));
    if (school?.headOfficeId != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedHeadOfficeId(String(school.headOfficeId));
    }
  }, [editingId, form.schoolId, isSuperAdmin, schools]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    if (!form.schoolId || !form.name || !form.date) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        schoolId: Number(form.schoolId),
        phone: form.phone ? `${phoneCode} ${String(form.phone).replace(/\D/g, "")}` : "",
      };

      if (editingId) {
        await updateCallLog(editingId, payload);
      } else {
        await createCallLog(payload);
      }

      setSuccess(true);
      setTimeout(() => onNavigate("call-log"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to save call log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? "Edit Call Log" : "Add Call Log"}
          </h1>
          <span className="text-secondary-light">
            Administrator / Call Log / {editingId ? "Edit" : "Add"}
          </span>
        </div>
        <button
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate("call-log")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-24 radius-8">{error}</div>
      )}

      {success && (
        <div className="alert alert-success mb-24 radius-8">
          Call log {editingId ? "updated" : "created"} successfully! Redirecting...
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {isSuperAdmin && (
                <FormField label="Head Office">
                  <select
                    className="form-control form-select"
                    value={selectedHeadOfficeId}
                    onChange={(e) => {
                      setSelectedHeadOfficeId(e.target.value);
                      setForm((prev) => ({ ...prev, schoolId: "" }));
                    }}
                    style={{ paddingLeft: "2.5rem" }}
                  >
                    <option value="">--Select Head Office--</option>
                    {headOffices.map((ho) => (
                      <option key={ho.id} value={String(ho.id)}>{ho.name}</option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="School Name" required>
                <select
                  id="schoolId"
                  className="form-control form-select"
                  value={form.schoolId}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                  disabled={!isSuperAdmin && !!authSchoolId}
                >
                  <option value="">--Select School--</option>
                  {filteredSchools.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.schoolName}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Name" required>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  placeholder="Enter name"
                  value={form.name}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <div className="col-md-6 mb-20">
                <PhoneCodeField
                  id="phone"
                  label="Phone Number"
                  required
                  code={phoneCode}
                  value={form.phone}
                  onCodeChange={setPhoneCode}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                />
              </div>

              <FormField label="Call Duration" required>
                <input
                  type="text"
                  id="callDuration"
                  className="form-control"
                  placeholder="e.g. 5 min"
                  value={form.callDuration}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="Call Date" required>
                <input
                  type="date"
                  id="date"
                  className="form-control"
                  value={form.date}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="Follow Up">
                <input
                  type="date"
                  id="followUpDate"
                  className="form-control"
                  value={form.followUpDate}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <div className="col-md-6 mb-20">
                <label className="form-label fw-semibold text-primary-light mb-8 d-block">Call Type</label>
                <div
                  className="d-flex align-items-center flex-wrap gap-24 py-8 avm-call-type-group"
                  style={{ minHeight: 44 }}
                >
                  <div className="form-check d-flex align-items-center gap-8 mb-0 p-0">
                    <input
                      type="radio"
                      className="form-check-input avm-call-type-radio m-0"
                      name="callType"
                      id="callTypeIncoming"
                      checked={form.callType === 'Incoming'}
                      onChange={() => setForm((p) => ({ ...p, callType: 'Incoming' }))}
                      style={{ width: 18, height: 18, accentColor: '#45597a', flexShrink: 0 }}
                    />
                    <label className="form-check-label mb-0" htmlFor="callTypeIncoming" style={{ lineHeight: 1 }}>
                      Incoming
                    </label>
                  </div>
                  <div className="form-check d-flex align-items-center gap-8 mb-0 p-0">
                    <input
                      type="radio"
                      className="form-check-input avm-call-type-radio m-0"
                      name="callType"
                      id="callTypeOutgoing"
                      checked={form.callType === 'Outgoing'}
                      onChange={() => setForm((p) => ({ ...p, callType: 'Outgoing' }))}
                      style={{ width: 18, height: 18, accentColor: '#45597a', flexShrink: 0 }}
                    />
                    <label className="form-check-label mb-0" htmlFor="callTypeOutgoing" style={{ lineHeight: 1 }}>
                      Outgoing
                    </label>
                  </div>
                </div>
              </div>

              <FormField label="Note" full>
                <textarea
                  id="note"
                  rows={4}
                  className="form-control"
                  placeholder="Enter note"
                  value={form.note}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem", paddingTop: "0.65rem" }}
                />
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate("call-log")}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Call Log" : "Save Call Log"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCallLog;
