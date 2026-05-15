import ManualScopeSelectors from '../components/ManualScopeSelectors'

const FIELD_ICONS = {
  'School Name': 'ri-school-line',
  Gallery: 'ri-gallery-line',
  Title: 'ri-video-line',
  'Video Link/File': 'ri-movie-line',
  Caption: 'ri-chat-quote-line',
}

const FormField = ({ label, required, children, full = false }) => (
  <div className={`avm-field${full ? ' full' : ''}`}>
    <label className="avm-label">
      {label}
      {required && <span className="req"> *</span>}
    </label>
    <div className="avm-input-with-icon" style={{ position: 'relative' }}>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '0.85rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#667085',
          fontSize: '0.95rem',
          lineHeight: 1,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <i className={FIELD_ICONS[label] || 'ri-edit-line'} />
      </span>
      {children}
    </div>
  </div>
)

const VideoEditorForm = ({
  isSuperAdmin,
  manualScope,
  schoolOptions,
  form,
  galleries,
  videoRef,
  onHeadOfficeChange,
  onSchoolChange,
  onGalleryChange,
  onFieldChange,
  onVideoFileChange,
}) => {
  return (
    <>
      <p className="avm-section-title">Basic Information</p>
      <div className="avm-grid">
        <div className="avm-field full" style={{ display: isSuperAdmin ? 'block' : 'none' }}>
          <ManualScopeSelectors
            enabled={isSuperAdmin}
            headOffices={manualScope.headOffices}
            schoolOptions={schoolOptions}
            selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
            onHeadOfficeChange={onHeadOfficeChange}
            selectedSchoolId={form.schoolId}
            onSchoolChange={onSchoolChange}
            compact
          />
        </div>

        {!isSuperAdmin ? (
          <FormField label="School Name" required full>
            <select
              className="avm-select"
              id="schoolId"
              value={form.schoolId}
              onChange={(e) => onSchoolChange(e.target.value)}
            >
              <option value="">--Select School--</option>
              {schoolOptions.map((school) => (
                <option key={String(school.id)} value={String(school.id)}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        <FormField label="Gallery" required full>
          <select
            className="avm-select"
            id="galleryId"
            value={form.galleryId}
            onChange={(e) => onGalleryChange(e.target.value)}
            disabled={!form.schoolId}
          >
            <option value="">--Select Gallery--</option>
            {galleries.map((gallery) => (
              <option key={String(gallery.id)} value={String(gallery.id)}>
                {gallery.title}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Title" required full>
          <input
            type="text"
            className="avm-input"
            id="title"
            placeholder="Video Title"
            value={form.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
          />
        </FormField>

        <div className="avm-field full">
          <label className="avm-label">
            Video Link/File<span className="req"> *</span>
          </label>
          <div className="d-flex flex-column gap-16">
            <div className="avm-input-with-icon" style={{ position: 'relative' }}>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#667085',
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <i className="ri-movie-line" />
              </span>
              <input
                type="text"
                className="avm-input"
                id="videoPath"
                placeholder="YouTube Link or File Path"
                value={form.videoPath}
                onChange={(e) => onFieldChange('videoPath', e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-12 flex-wrap">
              <span className="text-sm text-secondary-light">OR</span>
              <button type="button" className="avm-btn light btn-sm" onClick={() => videoRef.current?.click()}>
                <i className="ri-upload-2-line"></i> Upload Video File
              </button>
              <input
                ref={videoRef}
                type="file"
                accept=".mp4,.webm,.mov,.avi,.mkv"
                style={{ display: 'none' }}
                onChange={onVideoFileChange}
              />
              {form.videoFile ? <span className="text-xs text-success-600">{form.videoFile.name}</span> : null}
            </div>
          </div>
        </div>

        <FormField label="Caption" full>
          <textarea
            rows="4"
            className="avm-input avm-textarea"
            id="caption"
            placeholder="Caption"
            value={form.caption}
            onChange={(e) => onFieldChange('caption', e.target.value)}
          />
        </FormField>
      </div>
    </>
  )
}

export default VideoEditorForm
