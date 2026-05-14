import React, { useState, useEffect } from "react";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchHeadOfficesLookup } from "../apis/headOfficesApi";

const VehicleCreate = ({ onNavigate }) => {
  const [headOfficesLookup, setHeadOfficesLookup] = useState([]);
  const [schoolsLookup, setSchoolsLookup] = useState([]);
  const [allSchools, setAllSchools] = useState([]);

  const [formData, setFormData] = useState({
    headOfficeId: "",
    schoolId: "",
    vehicleNumber: "",
    vehicleModel: "",
    driver: "",
    vehicleLicense: "",
    vehicleContact: "",
    note: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const loadStaticLookups = async () => {
      try {
        const [ho, s] = await Promise.all([
          fetchHeadOfficesLookup(),
          fetchSchoolsLookup(),
        ]);
        setHeadOfficesLookup(ho);
        setAllSchools(s);
      } catch (err) {
        console.error("Error loading static lookups:", err);
      }
    };
    loadStaticLookups();
  }, []);

  // Filter schools when headOfficeId changes
  useEffect(() => {
    if (!formData.headOfficeId) {
      setSchoolsLookup([]);
    } else {
      const filtered = allSchools.filter(
        (s) => String(s.headOfficeId) === String(formData.headOfficeId)
      );
      setSchoolsLookup(filtered);
    }
  }, [formData.headOfficeId, allSchools]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "headOfficeId") {
        updated.schoolId = "";
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Vehicle Data:", formData);
    // onNavigate?.("vehicle"); // Uncomment when ready
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Vehicle</h1>
          <div className="text-secondary-light">
            <button
              type="button"
              className="text-secondary-light border-0 bg-transparent p-0"
              onClick={() => onNavigate?.("dashboard")}
            >
              Dashboard
            </button>{" "}
            /{" "}
            <button
              type="button"
              className="text-secondary-light border-0 bg-transparent p-0"
              onClick={() => onNavigate?.("vehicle")}
            >
              Vehicle
            </button>{" "}
            / Add
          </div>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-2"
          onClick={() => onNavigate?.("vehicle")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body p-24">
          <form onSubmit={handleSubmit}>
            {submitError && (
              <div className="alert alert-danger mb-24">{submitError}</div>
            )}

            <div className="row g-20">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Head Office <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  name="headOfficeId"
                  value={formData.headOfficeId}
                  onChange={handleChange}
                  required
                >
                  <option value="">--Select Head Office--</option>
                  {headOfficesLookup.map((ho) => (
                    <option key={ho.id} value={ho.id}>
                      {ho.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  School Name <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  required
                  disabled={!formData.headOfficeId}
                >
                  <option value="">--Select School--</option>
                  {schoolsLookup.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Vehicle Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="vehicleNumber"
                  placeholder="Vehicle Number"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="vehicleModel"
                  placeholder="Vehicle Model"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Driver
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="driver"
                  placeholder="Driver"
                  value={formData.driver}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Vehicle License
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="vehicleLicense"
                  placeholder="Vehicle License"
                  value={formData.vehicleLicense}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Vehicle Contact <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="vehicleContact"
                  placeholder="Vehicle Contact"
                  value={formData.vehicleContact}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-12">
                <label className="form-label fw-semibold text-primary-light">
                  Note
                </label>
                <textarea
                  className="form-control"
                  name="note"
                  rows="3"
                  placeholder="Note"
                  value={formData.note}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12 mt-24">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.("vehicle")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-32"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Vehicle"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleCreate;
