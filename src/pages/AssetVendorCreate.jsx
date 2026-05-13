import React, { useState, useRef, useEffect, useMemo } from 'react';
import useCountryCodes from '../hooks/useCountryCodes';

const DEFAULT_PHONE_CODE = '+91';
const PHONE_LENGTH_BY_ISO = {
  IN: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  GB: { min: 10, max: 10 },
  AU: { min: 9,  max: 9  },
  DE: { min: 10, max: 11 },
};
const DEFAULT_PHONE_LENGTH = { min: 6, max: 15 };

const PhoneCodeField = ({ id, label, value, code, onValueChange, onCodeChange, required = false }) => {
  const { countries } = useCountryCodes();
  const wrapperRef = useRef(null);
  const searchRef  = useRef(null);
  const [isOpen,  setIsOpen]  = useState(false);
  const [search, setSearch] = useState('');

  const uniqueCountries = useMemo(() => {
    const seen = new Set();
    return countries.filter((c) => { if (seen.has(c.code)) return false; seen.add(c.code); return true; });
  }, [countries]);

  const selectedCountry =
    uniqueCountries.find((c) => c.code === code) ||
    uniqueCountries.find((c) => c.code === DEFAULT_PHONE_CODE) ||
    uniqueCountries[0] ||
    { code: DEFAULT_PHONE_CODE, country: 'India', iso: 'IN' };

  const phoneLengthRule = PHONE_LENGTH_BY_ISO[selectedCountry.iso] || DEFAULT_PHONE_LENGTH;

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 0);
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return uniqueCountries;
    return uniqueCountries.filter(
      (c) => c.country.toLowerCase().includes(q) || c.code.includes(q) || c.iso.toLowerCase().includes(q),
    );
  }, [search, uniqueCountries]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label htmlFor={id} className="form-label fw-semibold text-primary-light">
        {label}{required ? <span className="text-danger"> *</span> : null}
      </label>
      <div className="input-group">
        <button
          type="button"
          className="form-select text-start"
          style={{ maxWidth: '11rem', minWidth: '11rem' }}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={`${label} country code`}
        >
          {selectedCountry.code} {selectedCountry.country}
        </button>
        <input
          type="tel"
          className="form-control"
          id={id}
          placeholder={label}
          value={value}
          onChange={(e) => onValueChange(e.target.value.replace(/\D/g, '').slice(0, phoneLengthRule.max))}
          maxLength={phoneLengthRule.max}
          pattern={`\\d{${phoneLengthRule.min},${phoneLengthRule.max}}`}
          title={`Enter ${phoneLengthRule.min === phoneLengthRule.max ? phoneLengthRule.max : `${phoneLengthRule.min}-${phoneLengthRule.max}`} digits`}
          required={required}
        />
      </div>

      {isOpen ? (
        <div
          className="border rounded-3 bg-white shadow-sm position-absolute mt-2"
          style={{ zIndex: 40, width: 'min(100%, 22rem)', left: 0, top: 'calc(100% + 0.4rem)' }}
        >
          <div className="p-2 border-bottom">
            <input
              ref={searchRef}
              type="text"
              className="form-control form-control-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredCountries.map((c) => (
              <button
                key={`${c.iso}-${c.code}`}
                type="button"
                className={`btn w-100 text-start rounded-0 border-0 px-3 py-2 ${c.code === selectedCountry.code ? 'bg-light' : ''}`}
                onClick={() => { onCodeChange(c.code); setIsOpen(false); setSearch(''); }}
              >
                {c.code} {c.country}
              </button>
            ))}
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-secondary-light">No countries found.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

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
