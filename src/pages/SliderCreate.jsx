import React, { useState } from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "Head Office": "ri-government-line",
  "School Name": "ri-school-line",
  Title: "ri-text",
  Caption: "ri-chat-1-line",
};

const FormField = ({ label, required, children, full = false, helpText = "" }) => {
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
      {helpText && <p className="text-xs text-secondary-light mt-4">{helpText}</p>}
    </div>
  );
};

const SliderCreate = ({ onNavigate }) => {
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Add New Slider</h1>
        <button 
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm" 
          onClick={() => onNavigate?.("slider")}
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

            <FormField label="Title" required >
              <input type="text" className="avm-input" placeholder="Slider Title" />
            </FormField>

            <FormField label="Caption" >
              <input type="text" className="avm-input" placeholder="Slider Caption" />
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Image <span className="text-danger-600">*</span></label>
              <div className="upload-container border border-neutral-300 radius-8 p-20 text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mb-12 radius-8" style={{ maxHeight: "200px", width: "auto" }} />
                ) : (
                  <div className="mb-12"><i className="ri-image-add-line text-40 text-secondary-light"></i></div>
                )}
                <input 
                  type="file" 
                  className="form-control" 
                  accept=".jpg,.jpeg,.png,.gif" 
                  onChange={handleImageChange} 
                />
                <div className="mt-8">
                  <p className="text-xs text-secondary-light mb-2">Dimension:- Max-W: 1920px, Max-H: 800px</p>
                  <p className="text-xs text-secondary-light">Image file format: .jpg, .jpeg, .png or .gif</p>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button 
                type="button" 
                className="btn btn-outline-neutral px-24 py-12 radius-8" 
                onClick={() => onNavigate?.("slider")}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary-600 px-24 py-12 radius-8"
              >
                Save Slider
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SliderCreate;