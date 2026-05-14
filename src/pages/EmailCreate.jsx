import React from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  "Receiver Type": "ri-group-line",
  Receiver: "ri-user-search-line",
  Subject: "ri-mail-line",
  Attachment: "ri-attachment-line",
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

const EmailCreate = ({ onNavigate }) => {
  const dynamicTags = ["[student_name]", "[parent_name]", "[guardian_name]", "[roll_no]", "[class]"];

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Send New Email</h1>
        <button 
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" 
          onClick={() => onNavigate?.("email")}
        >
          <i className="ri-arrow-left-line"></i> Back to History
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form className="avm-grid">
            <FormField label="Head Office" required >
              <select className="avm-select">
                <option value="">--Select Head Office--</option>
                <option value="1">Main Head Office</option>
              </select>
            </FormField>

            <FormField label="School Name" required >
              <select className="avm-select">
                <option value="">--Select School--</option>
                <option value="1">Windsor Park High School</option>
              </select>
            </FormField>

            <FormField label="Receiver Type" required>
              <select className="avm-select">
                <option value="">--Select--</option>
                <option value="student">Student</option>
                <option value="guardian">Guardian</option>
                <option value="staff">Staff</option>
              </select>
            </FormField>

            <FormField label="Receiver" required>
              <select className="avm-select">
                <option value="">--Select--</option>
              </select>
            </FormField>

            <FormField label="Subject" required full>
              <input type="text" className="avm-input" placeholder="Subject" />
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Email Body <span className="text-danger-600">*</span></label>
              <div className="mb-8 d-flex flex-wrap gap-8">
                {dynamicTags.map((tag) => (
                  <span key={tag} className="badge bg-info-100 text-info-600 cursor-pointer">{tag}</span>
                ))}
              </div>
              <textarea rows={8} className="form-control" placeholder="Write your email body here..." style={{ borderRadius: '8px' }} />
            </div>

            <div className="avm-field full">
              <label className="avm-label">Attachment</label>
              <input type="file" className="form-control" />
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
                <i className="ri-send-plane-2-line"></i> Send Email
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailCreate;
