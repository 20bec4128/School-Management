import { useEffect, useState } from "react";
import { createSuperAdmin, updateSuperAdmin } from "../apis/superAdminApi";
import PhoneCodeField from "../components/PhoneCodeField";

const EDIT_STORAGE_KEY = "edit-super-admin-row";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];
const ROLES = ["SUPER_ADMIN"];

const INITIAL_FORM = {
  name: "",
  nationalId: "",
  phone: "",
  gender: "",
  bloodGroup: "",
  religion: "",
  birthDate: "",
  presentAddress: "",
  permanentAddress: "",
  email: "",
  username: "",
  password: "",
  role: "SUPER_ADMIN",
  otherInfo: "",
};

const SuperAdminCreate = ({ onNavigate }) => {
  const navigateTo = typeof onNavigate === "function" ? onNavigate : () => {};

  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          setEditId(parsed.id);
          setForm({
            name: parsed.name || "",
            nationalId: parsed.nationalId || "",
            phone: parsed.phone || "",
            gender: parsed.gender || "",
            bloodGroup: parsed.bloodGroup || "",
            religion: parsed.religion || "",
            birthDate: parsed.birthDate || "",
            presentAddress: parsed.presentAddress || "",
            permanentAddress: parsed.permanentAddress || "",
            email: parsed.email || "",
            username: parsed.username || "",
            password: "", // blank for edit
            role: parsed.role || "SUPER_ADMIN",
            otherInfo: parsed.otherInfo || "",
          });
          if (parsed.photoUrl) {
            setPhotoPreview(parsed.photoUrl);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (editId) {
        await updateSuperAdmin(editId, form, { photo: photoFile, resume: resumeFile });
        setSuccess("Super Admin updated successfully!");
      } else {
        await createSuperAdmin(form, { photo: photoFile, resume: resumeFile });
        setSuccess("Super Admin created successfully!");
      }

      setTimeout(() => {
        try {
          sessionStorage.removeItem(EDIT_STORAGE_KEY);
        } catch {
          // ignore
        }
        navigateTo("manage-super-admin");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Failed to save super admin");
    } finally {
      setBusy(false);
    }
  };

  const isEdit = !!editId;

  // Inline theme styling consistent with application guidelines
  const cardStyle = {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderBottom: "1px solid #e2e8f0",
    padding: "16px 24px",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
  };

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div className="dashboard-main-body">
      {/* Breadcrumb */}
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEdit ? "Edit Super Admin" : "Add Super Admin"}
          </h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
            <span className="text-secondary-light text-sm"> / </span>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0 text-sm"
              onClick={() => navigateTo("manage-super-admin")}
            >
              Manage Super Admin
            </button>
            <span className="text-secondary-light text-sm"> / {isEdit ? "Edit" : "Add"}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-6"
            onClick={() => navigateTo("manage-super-admin")}
          >
            <i className="ri-arrow-left-line"></i> Back
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-8 mb-20">
          <i className="ri-error-warning-line"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-8 mb-20">
          <i className="ri-checkbox-circle-line"></i>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="d-flex flex-column gap-24">
          
          {/* Card 1: Basic Information */}
          <div className="card bg-white" style={cardStyle}>
            <div style={headerStyle}>
              <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                <i className="ri-user-line text-primary-600"></i> Basic Information
              </h6>
            </div>
            <div className="card-body p-24">
              <div className="row g-20">
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="name" className="form-label fw-medium text-primary-light mb-0">Name *</label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="nationalId" className="form-label fw-medium text-primary-light mb-0">National ID</label>
                  <input
                    type="text"
                    id="nationalId"
                    className="form-control"
                    style={inputStyle}
                    placeholder="National ID"
                    value={form.nationalId}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <PhoneCodeField
                    id="phone"
                    label="Phone number"
                    required
                    value={form.phone}
                    onChange={(fullValue) => setForm((prev) => ({ ...prev, phone: fullValue }))}
                  />
                </div>

                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="gender" className="form-label fw-medium text-primary-light mb-0">Gender *</label>
                  <select
                    id="gender"
                    className="form-select"
                    style={inputStyle}
                    value={form.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">--Select--</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="bloodGroup" className="form-label fw-medium text-primary-light mb-0">Blood Group</label>
                  <select
                    id="bloodGroup"
                    className="form-select"
                    style={inputStyle}
                    value={form.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="religion" className="form-label fw-medium text-primary-light mb-0">Religion</label>
                  <input
                    type="text"
                    id="religion"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Religion"
                    value={form.religion}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="birthDate" className="form-label fw-medium text-primary-light mb-0">Birth Date *</label>
                  <input
                    type="date"
                    id="birthDate"
                    className="form-control"
                    style={inputStyle}
                    value={form.birthDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="presentAddress" className="form-label fw-medium text-primary-light mb-0">Present Address</label>
                  <textarea
                    id="presentAddress"
                    className="form-control"
                    style={{ ...inputStyle, minHeight: "80px" }}
                    placeholder="Present Address"
                    value={form.presentAddress}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="permanentAddress" className="form-label fw-medium text-primary-light mb-0">Permanent Address</label>
                  <textarea
                    id="permanentAddress"
                    className="form-control"
                    style={{ ...inputStyle, minHeight: "80px" }}
                    placeholder="Permanent Address"
                    value={form.permanentAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Academic Information */}
          <div className="card bg-white" style={cardStyle}>
            <div style={headerStyle}>
              <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                <i className="ri-graduation-cap-line text-primary-600"></i> Academic Information
              </h6>
            </div>
            <div className="card-body p-24">
              <div className="row g-20">
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="email" className="form-label fw-medium text-primary-light mb-0">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="username" className="form-label fw-medium text-primary-light mb-0">Username *</label>
                  <input
                    type="text"
                    id="username"
                    className="form-control"
                    style={inputStyle}
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4 d-flex flex-column gap-8">
                  <label htmlFor="password" className="form-label fw-medium text-primary-light mb-0">
                    Password {isEdit ? "(Leave blank to keep current)" : "*"}
                  </label>
                  <div className="position-relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      className="form-control"
                      style={{ ...inputStyle, paddingRight: "44px" }}
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                      required={!isEdit}
                    />
                    <button
                      type="button"
                      className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-secondary-light pe-12"
                      onClick={() => setPasswordVisible((v) => !v)}
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                      style={{ lineHeight: 1 }}
                    >
                      <i className={passwordVisible ? "ri-eye-off-line" : "ri-eye-line"}></i>
                    </button>
                  </div>
                </div>

                <div className="col-md-6 d-flex flex-column gap-8">
                  <label htmlFor="role" className="form-label fw-medium text-primary-light mb-0">Role *</label>
                  <select
                    id="role"
                    className="form-select"
                    style={inputStyle}
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="">--Select--</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 d-flex flex-column gap-8">
                  <label htmlFor="resume" className="form-label fw-medium text-primary-light mb-0">Resume</label>
                  <input
                    type="file"
                    id="resume"
                    className="form-control"
                    style={inputStyle}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleResumeChange}
                  />
                  <div className="text-secondary-light text-xs mt-4-px">
                    Document file format: .pdf, .doc/docx, .ppt/pptx or .txt
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Other Information */}
          <div className="card bg-white" style={cardStyle}>
            <div style={headerStyle}>
              <h6 className="fw-semibold text-primary-light mb-0 d-flex align-items-center gap-8">
                <i className="ri-information-line text-primary-600"></i> Other Information
              </h6>
            </div>
            <div className="card-body p-24">
              <div className="row g-20">
                <div className="col-md-6 d-flex flex-column gap-8">
                  <label htmlFor="otherInfo" className="form-label fw-medium text-primary-light mb-0">Other Info</label>
                  <textarea
                    id="otherInfo"
                    className="form-control"
                    style={{ ...inputStyle, minHeight: "120px" }}
                    placeholder="Other Info"
                    value={form.otherInfo}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6 d-flex flex-column gap-8">
                  <label htmlFor="photo" className="form-label fw-medium text-primary-light mb-0">Photo</label>
                  <div className="d-flex align-items-start gap-20">
                    <input
                      type="file"
                      id="photo"
                      className="form-control flex-grow-1"
                      style={inputStyle}
                      accept=".jpg,.jpeg,.png,.gif"
                      onChange={handlePhotoChange}
                    />
                    {photoPreview && (
                      <div className="border border-neutral-200 rounded p-4-px bg-neutral-50" style={{ width: "90px", height: "90px" }}>
                        <img src={photoPreview} alt="Preview" className="w-100 h-100 object-fit-cover rounded" />
                      </div>
                    )}
                  </div>
                  <div className="text-secondary-light text-xs mt-4-px">
                    Dimension:- Max-W: 120px, Max-H: 130px<br />
                    Image file format: .jpg, .jpeg, .png or .gif
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="d-flex justify-content-end align-items-center gap-16 py-12">
            <button
              type="button"
              className="btn btn-outline-secondary px-24 py-10 radius-8"
              onClick={() => navigateTo("manage-super-admin")}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary-600 px-32 py-10 radius-8 d-flex align-items-center gap-8"
              disabled={busy}
            >
              {busy && <span className="spinner-border spinner-border-sm" role="status" />}
              {isEdit ? "Update Super Admin" : "Save Super Admin"}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default SuperAdminCreate;
