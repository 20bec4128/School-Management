import React, { useState } from 'react';

const emptyForm = {
  schoolId: '',
  bookId: '',
  memberId: '',
  returnDate: '',
  note: '',
};

const IssueBookCreate = ({ onNavigate }) => {
  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Issue New Book</h1>
          <span className="text-secondary-light">Library / Issue &amp; Return / Add</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('issue-return') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">Issue Information</h6>
        </div>
        <div className="card-body p-24">
          <form onSubmit={(e) => e.preventDefault()}>
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

              {/* Book — half */}
              <div className="col-md-6">
                <label htmlFor="bookId" className="form-label fw-semibold text-primary-light">
                  Book <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="bookId" value={form.bookId} onChange={handleChange} required>
                  <option value="">--Select Book--</option>
                </select>
              </div>

              {/* Library Member — half */}
              <div className="col-md-6">
                <label htmlFor="memberId" className="form-label fw-semibold text-primary-light">
                  Library Member <span className="text-danger">*</span>
                </label>
                <select className="form-control form-select" id="memberId" value={form.memberId} onChange={handleChange} required>
                  <option value="">--Select Member--</option>
                </select>
              </div>

              {/* Divider heading for auto-filled info */}
              <div className="col-12">
                <p className="fw-semibold text-secondary-light mb-0" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Book Details (auto-filled on selection)
                </p>
                <hr className="mt-4 mb-0" />
              </div>

              {/* ISBN No — half */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">ISBN No</label>
                <input type="text" className="form-control bg-light" readOnly placeholder="—" />
              </div>

              {/* Edition — half */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Edition</label>
                <input type="text" className="form-control bg-light" readOnly placeholder="—" />
              </div>

              {/* Author — half */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Author</label>
                <input type="text" className="form-control bg-light" readOnly placeholder="—" />
              </div>

              {/* Language — half */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Language</label>
                <input type="text" className="form-control bg-light" readOnly placeholder="—" />
              </div>

              {/* Price — half */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Price</label>
                <input type="text" className="form-control bg-light" readOnly placeholder="—" />
              </div>

              {/* Quantity — half */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Quantity Available</label>
                <input type="text" className="form-control bg-light" readOnly placeholder="—" />
              </div>

              {/* Almira No — half */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Almira No</label>
                <input type="text" className="form-control bg-light" readOnly placeholder="—" />
              </div>

              {/* Return Date — half */}
              <div className="col-md-6">
                <label htmlFor="returnDate" className="form-label fw-semibold text-primary-light">
                  Return Date <span className="text-danger">*</span>
                </label>
                <input type="date" className="form-control" id="returnDate" value={form.returnDate} onChange={handleChange} required />
              </div>

              {/* Note — full */}
              <div className="col-12">
                <label htmlFor="note" className="form-label fw-semibold text-primary-light">Note</label>
                <textarea className="form-control" id="note" rows="3" placeholder="Note" value={form.note} onChange={handleChange}></textarea>
              </div>

              {/* Book Cover — full */}
              <div className="col-12">
                <label className="form-label fw-semibold text-primary-light">Book Cover</label>
                <div className="d-flex align-items-center justify-content-center p-20 border rounded bg-light" style={{ minHeight: '80px' }}>
                  <span className="text-secondary-light">
                    <i className="ri-image-line me-8"></i>Cover will be displayed after book selection
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button
                type="button"
                className="btn btn-light border px-32"
                onClick={() => onNavigate?.('issue-return')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32">Issue Book</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IssueBookCreate;