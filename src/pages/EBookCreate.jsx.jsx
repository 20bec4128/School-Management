import React, { useState } from 'react';
import '../assets/css/addModalShared.css';

const emptyForm = {
  schoolId: '',
  classId: '',
  subjectId: '',
  ebookName: '',
  edition: '',
  author: '',
  language: '',
};

const EBookCreate = ({ onNavigate }) => {
  const [form, setForm] = useState(emptyForm);
  const [coverPreview, setCoverPreview] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'cover' && file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Add E-Book</h1>
          <span className="text-secondary-light">Library / E-Book / Add</span>
        </div>
        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => (onNavigate ? onNavigate('ebook-list') : window.history.back())}
        >
          <i className="ri-arrow-left-line"></i> Back to List
        </button>
      </div>

      <div className="card">
        <div className="card-header border-bottom border-neutral-200">
          <h6 className="text-md fw-semibold mb-0">E-Book Information</h6>
        </div>
        <div className="card-body p-24">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="row g-20 mb-32">
              
              <div className="col-12">
                <label className="form-label fw-semibold text-primary-light">School Name <span className="text-danger">*</span></label>
                <select className="form-control form-select" id="schoolId" value={form.schoolId} onChange={handleChange} required>
                  <option value="">--Select School--</option>
                  <option value="1">Windsor Park High School</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Class <span className="text-danger">*</span></label>
                <select className="form-control form-select" id="classId" value={form.classId} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Subject <span className="text-danger">*</span></label>
                <select className="form-control form-select" id="subjectId" value={form.subjectId} onChange={handleChange} required>
                  <option value="">--Select--</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" id="ebookName" placeholder="Name" value={form.ebookName} onChange={handleChange} required />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Edition</label>
                <input type="text" className="form-control" id="edition" placeholder="Edition" value={form.edition} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Author</label>
                <input type="text" className="form-control" id="author" placeholder="Author" value={form.author} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Language</label>
                <input type="text" className="form-control" id="language" placeholder="Language" value={form.language} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">Cover Image</label>
                <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.gif" onChange={(e) => handleFileChange(e, 'cover')} />
                <p className="text-xs text-secondary-light mt-8">Max-W: 600px, Max-H: 800px (.jpg, .jpeg, .png, .gif)</p>
                {coverPreview && <img src={coverPreview} alt="preview" className="mt-12 radius-8 w-100-px h-120-px object-fit-cover border" />}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">E-Book File <span className="text-danger">*</span></label>
                <input type="file" className="form-control" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" required />
                <p className="text-xs text-secondary-light mt-8">Format: .pdf, .doc/docx, .ppt/pptx or .txt</p>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-12">
              <button 
                type="button" 
                className="btn btn-light border px-32" 
                onClick={() => onNavigate?.('ebook-list')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-600 px-32">Save E-Book</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EBookCreate;