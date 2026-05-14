import React, { useState } from "react";
import "../assets/css/addModalShared.css";

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  "Route Name": "ri-map-pin-line",
  "Route Start": "ri-map-pin-range-line",
  "Route End": "ri-map-pin-5-line",
  "Vehicle for Route": "ri-bus-2-line",
  Note: "ri-sticky-note-line",
  "Stop Name": "ri-road-map-line",
  "Stop KM": "ri-pin-distance-line",
  "Stop Fare": "ri-money-dollar-circle-line",
};

const emptyStop = { stopName: "", stopKm: "", stopFare: "" };

const emptyForm = {
  headOfficeId: "",
  schoolId: "",
  routeName: "",
  routeStart: "",
  routeEnd: "",
  vehicle: "",
  note: "",
  stops: [{ ...emptyStop }],
};

const FormField = ({ label, required, children, full = false }) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";
  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label}
        {required && <span className="text-danger-600"> *</span>}
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

const TransportRouteCreate = ({ onNavigate }) => {
  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleStopChange = (index, field, value) => {
    setFormData((prev) => {
      const stops = prev.stops.map((stop, i) =>
        i === index ? { ...stop, [field]: value } : stop,
      );
      return { ...prev, stops };
    });
  };

  const addStopRow = () => {
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, { ...emptyStop }],
    }));
  };

  const removeStopRow = (index) => {
    setFormData((prev) => {
      if (prev.stops.length === 1) return prev;
      return {
        ...prev,
        stops: prev.stops.filter((_, i) => i !== index),
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save logic goes here.
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            Add Transport Route
          </h1>
          <span className="text-secondary-light">
            Transport / Route Management / Add
          </span>
        </div>
        <button
          type="button"
          className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
          onClick={() => onNavigate?.("transport-route")}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form className="avm-grid" onSubmit={handleSubmit}>
            <FormField label="Head Office" required>
              <select
                className="avm-select"
                id="headOfficeId"
                value={formData.headOfficeId}
                onChange={handleChange}
              >
                <option value="">--Select Head Office--</option>
                <option value="1">Main Head Office</option>
              </select>
            </FormField>

            <FormField label="School Name" required>
              <select
                className="avm-select"
                id="schoolId"
                value={formData.schoolId}
                onChange={handleChange}
              >
                <option value="">--Select School--</option>
                <option value="1">Windsor Park High School</option>
              </select>
            </FormField>

            <FormField label="Route Name" required >
              <input
                type="text"
                className="avm-input"
                id="routeName"
                placeholder="Route Name"
                value={formData.routeName}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Route Start" required>
              <input
                type="text"
                className="avm-input"
                id="routeStart"
                placeholder="Route Start"
                value={formData.routeStart}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Route End" required>
              <input
                type="text"
                className="avm-input"
                id="routeEnd"
                placeholder="Route End"
                value={formData.routeEnd}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Vehicle for Route" required>
              <select
                className="avm-select"
                id="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
              >
                <option value="">--Select Vehicle--</option>
                <option value="Bus-01">School Bus - 01</option>
                <option value="Bus-02">School Bus - 02</option>
                <option value="Van-01">Mini Van - 01</option>
              </select>
            </FormField>

            <div className="avm-field full">
              <label className="avm-label">Route Stop Fare</label>
              <div className="table-responsive">
                <table className="table bordered-table mb-0 data-table">
                  <thead>
                    <tr>
                      <th>Stop Name</th>
                      <th>Stop KM</th>
                      <th>Stop Fare</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.stops.map((stop, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="form-control avm-input"
                            placeholder="Stop Name"
                            value={stop.stopName}
                            onChange={(e) =>
                              handleStopChange(
                                index,
                                "stopName",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control avm-input"
                            placeholder="Stop KM"
                            value={stop.stopKm}
                            onChange={(e) =>
                              handleStopChange(index, "stopKm", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control avm-input"
                            placeholder="Stop Fare"
                            value={stop.stopFare}
                            onChange={(e) =>
                              handleStopChange(
                                index,
                                "stopFare",
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="text-danger-600 bg-transparent border-0"
                            onClick={() => removeStopRow(index)}
                            disabled={formData.stops.length === 1}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary mt-12"
                onClick={addStopRow}
              >
                <i className="ri-add-line"></i> Add Stop
              </button>
            </div>

            <FormField label="Note" full>
              <textarea
                className="avm-input avm-textarea"
                id="note"
                rows="3"
                placeholder="Note"
                value={formData.note}
                onChange={handleChange}
              />
            </FormField>

            <div className="d-flex justify-content-end gap-12 mt-24 full">
              <button
                type="button"
                className="btn btn-outline-neutral px-24 py-12 radius-8"
                onClick={() => onNavigate?.("transport-route")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-600 px-24 py-12 radius-8"
              >
                Save Route
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransportRouteCreate;
