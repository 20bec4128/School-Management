import React, { useState } from 'react';

const emptyForm = {
  schoolId: '',
  categoryId: '',
  itemName: '',
  productCode: '',
  type: '',
  storeId: '',
  note: '',
};

const AssetItemCreate = ({ onNavigate }) => {
  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (onNavigate) onNavigate('asset-item');
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add Asset Item</h1>
          <span className="text-secondary-light">Asset Management / Item</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('asset-item') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Item Information</h6>
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

              {/* Category — half */}
              <div className="col-md-6">
                <label htmlFor="categoryId" className="form-label fw-semibold text-primary-light">
                  Category <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="categoryId" value={form.categoryId} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Item Name — half */}
              <div className="col-md-6">
                <label htmlFor="itemName" className="form-label fw-semibold text-primary-light">
                  Item Name <span className="text-danger">*</span>
                </label>
                <input type="text" className="form-control" id="itemName" placeholder="Item Name" value={form.itemName} onChange={handleChange} required />
              </div>

              {/* Product Code — half */}
              <div className="col-md-6">
                <label htmlFor="productCode" className="form-label fw-semibold text-primary-light">Product Code</label>
                <input type="text" className="form-control" id="productCode" placeholder="Product Code" value={form.productCode} onChange={handleChange} />
              </div>

              {/* Type — half */}
              <div className="col-md-6">
                <label htmlFor="type" className="form-label fw-semibold text-primary-light">Type</label>
                <select className="form-control form-select" id="type" value={form.type} onChange={handleChange}>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Store — half */}
              <div className="col-md-6">
                <label htmlFor="storeId" className="form-label fw-semibold text-primary-light">
                  Store <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="storeId" value={form.storeId} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              {/* Note — full */}
              <div className="col-12">
                <label htmlFor="note" className="form-label fw-semibold text-primary-light">Note</label>
                <textarea className="form-control" id="note" rows="3" placeholder="Note" value={form.note} onChange={handleChange}></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button type="button" className="btn btn-light border px-32" onClick={() => onNavigate?.('asset-item')}>Cancel</button>
              <button type="submit" className="btn btn-primary-600 px-32">Save Item</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetItemCreate;
