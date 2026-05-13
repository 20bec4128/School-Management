import React, { useState } from 'react';

const emptyForm = {
  schoolId: '',
  vendorId: '',
  categoryId: '',
  assetId: '',
  quantity: '',
  unitType: '',
  unitPrice: '',
  purchaseDate: '',
  expireDate: '',
  purchaseBy: '',
  note: '',
};

const AssetPurchaseCreate = ({ onNavigate }) => {
  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (onNavigate) onNavigate('asset-purchase');
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Asset Purchase</h1>
          <span className="text-secondary-light">Asset Management / Purchase</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('asset-purchase') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Purchase Information</h6>
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

              {/* Vendor — half */}
              <div className="col-md-6">
                <label htmlFor="vendorId" className="form-label fw-semibold text-primary-light">
                  Vendor <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="vendorId" value={form.vendorId} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Category — half */}
              <div className="col-md-6">
                <label htmlFor="categoryId" className="form-label fw-semibold text-primary-light">
                  Category <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="categoryId" value={form.categoryId} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Asset — full width */}
              <div className="col-12">
                <label htmlFor="assetId" className="form-label fw-semibold text-primary-light">
                  Asset <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="assetId" value={form.assetId} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Quantity — half */}
              <div className="col-md-6">
                <label htmlFor="quantity" className="form-label fw-semibold text-primary-light">
                  Quantity <span className="text-danger">*</span>
                </label>
                <input type="number" className="form-control" id="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} required min="1" />
              </div>

              {/* Unit Type — half */}
              <div className="col-md-6">
                <label htmlFor="unitType" className="form-label fw-semibold text-primary-light">Unit Type</label>
                <select className="form-control form-select" id="unitType" value={form.unitType} onChange={handleChange}>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Unit Price — half */}
              <div className="col-md-6">
                <label htmlFor="unitPrice" className="form-label fw-semibold text-primary-light">
                  Unit Price <span className="text-danger">*</span>
                </label>
                <input type="number" className="form-control" id="unitPrice" placeholder="Unit Price" value={form.unitPrice} onChange={handleChange} required min="0" />
              </div>

              {/* Purchase By — half */}
              <div className="col-md-6">
                <label htmlFor="purchaseBy" className="form-label fw-semibold text-primary-light">
                  Purchase By <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="purchaseBy" value={form.purchaseBy} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Purchase Date — half */}
              <div className="col-md-6">
                <label htmlFor="purchaseDate" className="form-label fw-semibold text-primary-light">
                  Purchase Date <span className="text-danger">*</span>
                </label>
                <input type="date" className="form-control" id="purchaseDate" value={form.purchaseDate} onChange={handleChange} required />
              </div>

              {/* Expire Date — half */}
              <div className="col-md-6">
                <label htmlFor="expireDate" className="form-label fw-semibold text-primary-light">Expire Date</label>
                <input type="date" className="form-control" id="expireDate" value={form.expireDate} onChange={handleChange} />
              </div>

              {/* Note — full */}
              <div className="col-12">
                <label htmlFor="note" className="form-label fw-semibold text-primary-light">Note</label>
                <textarea className="form-control" id="note" rows="3" placeholder="Note" value={form.note} onChange={handleChange}></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate?.('asset-purchase')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-32">Save Purchase</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetPurchaseCreate;
