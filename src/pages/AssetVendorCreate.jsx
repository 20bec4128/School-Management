import React, { useState, useRef, useEffect, useMemo } from 'react';
import PhoneCodeField from '../components/PhoneCodeField';

const DEFAULT_PHONE_CODE = '+91';

const emptyForm = {
  schoolId: '',
  vendorName: '',
  email: '',
  phone: '',
  contactName: '',
  address: '',
  note: '',
};

const AssetVendorCreate = ({ onNavigate }) => {
  const [form, setForm] = useState(emptyForm);
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (onNavigate) onNavigate('asset-vendor');
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Asset Vendor</h1>
          <span className="text-secondary-light">Asset Management / Vendor</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('asset-vendor') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Vendor Information</h6>
        </div>
        <div className="card-body p-24">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="row g-20 mb-32">

              {/* School — full width */}
              <div className="col-12">
                <label htmlFor="schoolId" className="form-label fw-semibold text-primary-light">
                  School Name <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="schoolId" value={form.schoolId} onChange={handleChange} required>
                  <option value="">--Select School--</option>
                </select>
              </div>

              {/* Vendor Name — half */}
              <div className="col-md-6">
                <label htmlFor="vendorName" className="form-label fw-semibold text-primary-light">
                  Name <span className="text-danger">*</span>
                </label>
                <input type="text" className="form-control" id="vendorName" placeholder="Vendor Name" value={form.vendorName} onChange={handleChange} required />
              </div>

              {/* Contact Name — half */}
              <div className="col-md-6">
                <label htmlFor="contactName" className="form-label fw-semibold text-primary-light">
                  Contact Name <span className="text-danger">*</span>
                </label>
                <input type="text" className="form-control" id="contactName" placeholder="Contact Name" value={form.contactName} onChange={handleChange} required />
              </div>

              {/* Email — half */}
              <div className="col-md-6">
                <label htmlFor="email" className="form-label fw-semibold text-primary-light">Email</label>
                <input type="email" className="form-control" id="email" placeholder="Email" value={form.email} onChange={handleChange} />
              </div>

              {/* Phone with country code — half */}
              <div className="col-md-6">
                <PhoneCodeField
                  id="phone"
                  label="Phone Number"
                  code={phoneCode}
                  value={form.phone}
                  onCodeChange={setPhoneCode}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                />
              </div>

              {/* Address — full */}
              <div className="col-12">
                <label htmlFor="address" className="form-label fw-semibold text-primary-light">Address</label>
                <input type="text" className="form-control" id="address" placeholder="Address" value={form.address} onChange={handleChange} />
              </div>

              {/* Note — full */}
              <div className="col-12">
                <label htmlFor="note" className="form-label fw-semibold text-primary-light">Note</label>
                <textarea className="form-control" id="note" rows="3" placeholder="Note" value={form.note} onChange={handleChange}></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate?.('asset-vendor')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-32">Save Vendor</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetVendorCreate;
