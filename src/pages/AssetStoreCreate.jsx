import React, { useState, useRef, useEffect, useMemo } from 'react';
import PhoneCodeField from '../components/PhoneCodeField';

const emptyForm = {
  schoolId: '',
  storeName: '',
  storeKeeper: '',
  phone: '',
  address: '',
  note: '',
};

const AssetStoreCreate = ({ onNavigate }) => {
  const [form, setForm] = useState(emptyForm);
  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (onNavigate) onNavigate('asset-store');
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Asset Store</h1>
          <span className="text-secondary-light">Asset Management / Store</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('asset-store') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Store Information</h6>
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

              {/* Store Name — half */}
              <div className="col-md-6">
                <label htmlFor="storeName" className="form-label fw-semibold text-primary-light">
                  Store Name <span className="text-danger">*</span>
                </label>
                <input type="text" className="form-control" id="storeName" placeholder="Store Name" value={form.storeName} onChange={handleChange} required />
              </div>

              {/* Store Keeper — half */}
              <div className="col-md-6">
                <label htmlFor="storeKeeper" className="form-label fw-semibold text-primary-light">Store Keeper</label>
                <input type="text" className="form-control" id="storeKeeper" placeholder="Store Keeper" value={form.storeKeeper} onChange={handleChange} />
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

              {/* Address — half */}
              <div className="col-md-6">
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
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate?.('asset-store')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-32">Save Store</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetStoreCreate;
