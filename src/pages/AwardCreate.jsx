import React from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "Head Office": "ri-government-line",
  "School Name": "ri-school-line",
  "User Type": "ri-group-line",
  Winner: "ri-user-star-line",
  Title: "ri-medal-line",
  Gift: "ri-gift-line",
  Price: "ri-money-dollar-circle-line",
  Date: "ri-calendar-line",
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
        <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#667085", zIndex: 1 }}>
          <i className={icon}></i>
        </span>
        {children}
      </div>
    </div>
  );
};

const AwardCreate = ({ onNavigate }) => {
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Add New Award</h1>
        <button 
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" 
          onClick={() => onNavigate?.("manage-award")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form className="avm-grid">
            <FormField label="Head Office" required>
              <select className="avm-select">
                <option value="">--Select Head Office--</option>
                <option value="1">Main Head Office</option>
              </select>
            </FormField>

            <FormField label="School Name" required>
              <select className="avm-select">
                <option value="">--Select School--</option>
                <option value="1">Windsor Park High School</option>
              </select>
            </FormField>

            <FormField label="User Type" required>
              <select className="avm-select">
                <option value="">--Select--</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </FormField>

            <FormField label="Winner" required>
              <select className="avm-select">
                <option value="">--Select--</option>
              </select>
            </FormField>

            <FormField label="Title" required >
              <input type="text" className="avm-input" placeholder="Award Title" />
            </FormField>

            <FormField label="Gift" required>
              <input type="text" className="avm-input" placeholder="Gift Name" />
            </FormField>

            <FormField label="Price" required>
              <input type="number" className="avm-input" placeholder="0.00" />
            </FormField>

            <FormField label="Date" required>
              <input type="date" className="avm-input" />
            </FormField>

            <FormField label="Note" full>
              <textarea rows={4} className="avm-input avm-textarea" placeholder="Note" style={{ paddingLeft: '2.5rem' }} />
            </FormField>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button 
                type="button" 
                className="btn btn-outline-neutral px-24 py-12 radius-8" 
                onClick={() => onNavigate?.("manage-award")}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary-600 px-24 py-12 radius-8"
              >
                Save Award
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AwardCreate;