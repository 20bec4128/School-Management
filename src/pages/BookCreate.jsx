import React, { useState } from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "School Name": "ri-school-line",
  Title: "ri-book-line",
  "Book ID": "ri-hashtag",
  "ISBN No": "ri-barcode-line",
  Edition: "ri-bookmark-line",
  Author: "ri-user-follow-line",
  Language: "ri-global-line",
  Price: "ri-money-dollar-circle-line",
  Quantity: "ri-equalizer-line",
  "Almira No": "ri-layout-grid-line",
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

const BookCreate = ({ onNavigate }) => {
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <h1 className="fw-semibold mb-0 h6 text-primary-light">Add New Book</h1>
        <button
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => onNavigate?.("book")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form className="avm-grid">
            <FormField label="School Name" required full>
              <select className="avm-select">
                <option value="">--Select School--</option>
                <option value="1">Windsor Park High School</option>
              </select>
            </FormField>

            <FormField label="Title" required full>
              <input type="text" className="avm-input" placeholder="Title" />
            </FormField>

            <FormField label="Book ID" required>
              <input type="text" className="avm-input" placeholder="Book ID" />
            </FormField>

            <FormField label="ISBN No">
              <input type="text" className="avm-input" placeholder="ISBN No" />
            </FormField>

            <FormField label="Edition">
              <input type="text" className="avm-input" placeholder="Edition" />
            </FormField>

            <FormField label="Author">
              <input type="text" className="avm-input" placeholder="Author" />
            </FormField>

            <FormField label="Language">
              <input type="text" className="avm-input" placeholder="Language" />
            </FormField>

            <FormField label="Price">
              <input type="number" className="avm-input" placeholder="Price" />
            </FormField>

            <FormField label="Quantity" required>
              <input
                type="number"
                className="avm-input"
                placeholder="Quantity"
              />
            </FormField>

            <FormField label="Almira No">
              <input
                type="text"
                className="avm-input"
                placeholder="Almira No"
              />
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Book Cover</label>
              <div className="upload-container border border-neutral-300 radius-8 p-20 text-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mb-12 radius-8"
                    style={{ maxHeight: "200px" }}
                  />
                ) : (
                  <div className="mb-12">
                    <i className="ri-image-add-line text-40 text-secondary-light"></i>
                  </div>
                )}
                <input
                  type="file"
                  className="form-control"
                  accept=".jpg,.jpeg,.png,.gif"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-secondary-light mt-8">
                  Max-W: 600px, Max-H: 800px (.jpg, .jpeg, .png, .gif)
                </p>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button
                type="button"
                className="btn btn-outline-neutral px-24 py-12 radius-8"
                onClick={() => (onNavigate ? onNavigate("book") : window.history.back())}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-24 py-12 radius-8"
              >
                Save Book
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookCreate;
