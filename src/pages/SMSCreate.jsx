import React, { useState } from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  "Receiver Type": "ri-group-line",
  Receiver: "ri-user-search-line",
  Gateway: "ri-router-line",
  SMS: "ri-chat-sms-line",
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

const SMSCreate = ({ onNavigate }) => {
  const [message, setMessage] = useState("");
  const limit = 160;

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Send New SMS</h1>
        <button className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" onClick={() => onNavigate?.("sms")}>
          <i className="ri-arrow-left-line"></i> Back to History
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
              </select>
            </FormField>

            <FormField label="Receiver" required>
              <select className="avm-select">
                <option value="">--Select--</option>
              </select>
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">SMS <span className="text-danger-600">*</span></label>
              <div className="mb-12 d-flex flex-wrap gap-8">
                 <span className="text-secondary-light text-sm me-8">Dynamic Tag:</span>
                 <span className="badge bg-info-100 text-info-600 cursor-pointer">[name]</span>
              </div>
              <textarea 
                rows={5} 
                className="form-control" 
                placeholder="Write your message..." 
                style={{ borderRadius: '8px' }}
                value={message}
                onChange={(e) => setMessage(e.target.value.substring(0, limit))}
              />
              <div className="mt-8 text-sm text-secondary-light d-flex justify-content-between">
                <span>You have remain character/ letter : <span className={limit - message.length < 10 ? "text-danger-600 fw-bold" : ""}>{limit - message.length}</span></span>
                <span>{message.length} / {limit}</span>
              </div>
            </div>

            <FormField label="Gateway" required full>
              <select className="avm-select">
                <option value="">--Select--</option>
                <option value="twilio">Twilio</option>
                <option value="msg91">MSG91</option>
              </select>
            </FormField>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button type="button" className="btn btn-outline-neutral px-24 py-12 radius-8" onClick={() => onNavigate?.("sms")}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-24 py-12 radius-8 d-flex align-items-center gap-8">
                <i className="ri-send-plane-fill"></i> Send SMS
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SMSCreate;
