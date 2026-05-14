import React from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  Name: "ri-hotel-line",
  "Hostel Type": "ri-community-line",
  Address: "ri-map-pin-line",
  Note: "ri-sticky-note-line",
};

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
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
          }}
        >
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const HostelCreate = ({ onNavigate }) => {
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Add Hostel</h1>
        <button
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => onNavigate?.("manage-hostel")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form className="avm-grid">
            <FormField label="Head Office" required full>
              <select className="avm-select">
                <option value="">--Select Head Office--</option>
                <option value="1">Main Head Office</option>
              </select>
            </FormField>

            <FormField label="School Name" required full>
              <select className="avm-select">
                <option value="">--Select School--</option>
                <option value="1">Windsor Park High School</option>
              </select>
            </FormField>

            <FormField label="Name" required>
              <input type="text" className="avm-input" placeholder="Name" />
            </FormField>

            <FormField label="Hostel Type" required>
              <select className="avm-select">
                <option value="">--Select--</option>
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Mixed">Mixed</option>
              </select>
            </FormField>

            <FormField label="Address" required full>
              <input type="text" className="avm-input" placeholder="Address" />
            </FormField>

            <FormField label="Note" full>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                placeholder="Note"
                style={{ paddingLeft: "2.5rem" }}
              />
            </FormField>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button
                type="button"
                className="btn btn-outline-neutral px-24 py-12 radius-8"
                onClick={() => onNavigate?.("manage-hostel")}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-24 py-12 radius-8">
                Save Hostel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HostelCreate;
