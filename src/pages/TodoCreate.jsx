import React from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "Head Office": "ri-government-line",
  "School Name": "ri-school-line",
  "User Type": "ri-group-line",
  "Assign To": "ri-user-line",
  Title: "ri-text",
  Date: "ri-calendar-line",
  "Work Status": "ri-list-check-2",
  Description: "ri-article-line",
  Comment: "ri-chat-1-line",
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

const TodoCreate = ({ onNavigate }) => {
  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Add New Todo</h1>
        <button
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => onNavigate?.("manage-todo")}
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
                <option value="Staff">Staff</option>
                <option value="Teacher">Teacher</option>
              </select>
            </FormField>

            <FormField label="Assign To" required>
              <select className="avm-select">
                <option value="">--Select--</option>
              </select>
            </FormField>

            <FormField label="Title" required >
              <input
                type="text"
                className="avm-input"
                placeholder="Todo Title"
              />
            </FormField>

            <FormField label="Date" required>
              <input type="date" className="avm-input" />
            </FormField>

            <FormField label="Work Status" required>
              <select className="avm-select">
                <option value="">--Select--</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </FormField>

            <FormField label="Description" full>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                placeholder="Enter description"
                style={{ paddingLeft: "2.5rem" }}
              />
            </FormField>

            <FormField label="Comment" full>
              <textarea
                rows={4}
                className="avm-input avm-textarea"
                placeholder="Enter comment"
                style={{ paddingLeft: "2.5rem" }}
              />
            </FormField>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button
                type="button"
                className="btn btn-outline-neutral px-24 py-12 radius-8"
                onClick={() => onNavigate?.("manage-todo")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-24 py-12 radius-8"
              >
                Save Todo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TodoCreate;
