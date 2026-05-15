import React, { useState, useEffect } from "react";
import { createVisitorInfo, updateVisitorInfo } from "../apis/visitorInfoApi";
import { fetchVisitorPurposes } from "../apis/visitorPurposeApi";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";
import { useAuth } from "../context/useAuth";
import PhoneCodeField from "../components/PhoneCodeField";
import "../assets/css/addModalShared.css";

const EDIT_STORAGE_KEY = "visitor-info-edit-row";
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
  purposeId: "",
  comingFrom: "",
  idCard: "",
  numOfPerson: 1,
  date: new Date().toISOString().split("T")[0],
  inTime: "",
  outTime: "",
  note: "",
};

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Name: "ri-user-3-line",
  "Phone Number": "ri-phone-line",
  "Visitor Purpose": "ri-question-answer-line",
  "Coming From": "ri-map-pin-line",
  "ID Card": "ri-id-card-line",
  "Number of Person": "ri-group-line",
  Date: "ri-calendar-line",
  "In Time": "ri-time-line",
  "Out Time": "ri-time-line",
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

const AddVisitorInfo = ({ onNavigate }) => {
  const { role, schoolId: authSchoolId } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [headOffices, setHeadOffices] = useState([]);
  const [schools, setSchools] = useState([]);
  const [purposes, setPurposes] = useState([]);
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
          purposeId: row.purposeId != null ? String(row.purposeId) : "",
          comingFrom: row.comingFrom || "",
          idCard: row.idCard || "",
          numOfPerson: row.numOfPerson ?? 1,
          date: row.date || new Date().toISOString().split("T")[0],
          inTime: row.inTime || "",
          outTime: row.outTime || "",
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

  // Filter schools by head office
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

  // Load purposes when schoolId changes
  useEffect(() => {
    const loadPurposes = async () => {
      if (!form.schoolId) {
        setPurposes([]);
        return;
      }
      try {
        const list = await fetchVisitorPurposes(form.schoolId);
        setPurposes(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load purposes", err);
        setPurposes([]);
      }
    };
    loadPurposes();
  }, [form.schoolId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess(false);

    if (!form.schoolId || !form.name || !form.purposeId || !form.date) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        schoolId: Number(form.schoolId),
        purposeId: Number(form.purposeId),
        numOfPerson: Number(form.numOfPerson),
        phone: form.phone ? `${phoneCode} ${String(form.phone).replace(/\D/g, "")}` : "",
      };

      if (editingId) {
        await updateVisitorInfo(editingId, payload);
      } else {
        await createVisitorInfo(payload);
      }

      setSuccess(true);
      setTimeout(() => onNavigate("visitor-info"), 1000);
    } catch (err) {
      setError(err?.message || "Failed to save visitor info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {editingId ? "Edit Visitor Info" : "Add Visitor Info"}
          </h1>
          <span className="text-secondary-light">
            Administrator / Visitor Info / {editingId ? "Edit" : "Add"}
          </span>
        </div>
        <button
          className="btn btn-light border px-20 d-flex align-items-center gap-6"
          onClick={() => onNavigate("visitor-info")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-error-warning-line text-lg" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
          <i className="ri-checkbox-circle-line text-lg" />
          Visitor info {editingId ? "updated" : "created"} successfully! Redirecting...
        </div>
      )}

      <div className="card h-100">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {isSuperAdmin && (
                <FormField label="Head Office" >
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
                      <option key={ho.id} value={String(ho.id)}>
                        {ho.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="School Name" required >
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
                    <option key={s.id} value={String(s.id)}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Name" required>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  placeholder="Visitor name"
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

              <FormField label="Visitor Purpose" required>
                <select
                  id="purposeId"
                  className="form-control form-select"
                  value={form.purposeId}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                  disabled={!form.schoolId}
                >
                  <option value="">--Select Purpose--</option>
                  {purposes.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.purpose}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Coming From">
                <input
                  type="text"
                  id="comingFrom"
                  className="form-control"
                  placeholder="Where is the visitor coming from?"
                  value={form.comingFrom}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="ID Card">
                <input
                  type="text"
                  id="idCard"
                  className="form-control"
                  placeholder="ID card information"
                  value={form.idCard}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="Number of Person">
                <input
                  type="number"
                  id="numOfPerson"
                  className="form-control"
                  min="1"
                  value={form.numOfPerson}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="Date" required>
                <input
                  type="date"
                  id="date"
                  className="form-control"
                  value={form.date}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="In Time">
                <input
                  type="time"
                  id="inTime"
                  className="form-control"
                  value={form.inTime}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="Out Time">
                <input
                  type="time"
                  id="outTime"
                  className="form-control"
                  value={form.outTime}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </FormField>

              <FormField label="Note" full>
                <textarea
                  id="note"
                  rows={3}
                  className="form-control"
                  placeholder="Additional notes..."
                  value={form.note}
                  onChange={handleChange}
                  style={{ paddingLeft: "2.5rem", paddingTop: "0.65rem" }}
                />
              </FormField>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate("visitor-info")}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Visitor" : "Save Visitor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVisitorInfo;
