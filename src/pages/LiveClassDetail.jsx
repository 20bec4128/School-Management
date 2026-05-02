import { useEffect, useState } from 'react'
import { fetchLiveClass, startLiveClass } from '../apis/liveClassesApi'
import MeetingRoom from './MeetingRoom'

const DetailItem = ({ label, value }) => (
  <div>
    <span className="text-sm text-secondary-light d-block mb-4">{label}</span>
    <span className="fw-medium text-primary-light">{value || '-'}</span>
  </div>
)

const LiveClassDetail = ({ liveClassId, onBack }) => {
  const [liveClass, setLiveClass] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMeeting, setShowMeeting] = useState(false)
  const [showLiveKitRoom, setShowLiveKitRoom] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!liveClassId) return
    setLoading(true)
    setError('')
    fetchLiveClass(liveClassId)
      .then(setLiveClass)
      .catch((err) => setError(err?.message || 'Failed to load live class'))
      .finally(() => setLoading(false))
  }, [liveClassId])

  const isLiveKit = String(liveClass?.liveClassType || '').toLowerCase().includes('livekit')

  const handleStart = async () => {
    if (!liveClassId) return
    setActionLoading(true)
    setError('')
    try {
      const started = await startLiveClass(liveClassId)
      setLiveClass((prev) => (prev ? { ...prev, status: started.status, roomName: started.roomName, startedAt: started.startedAt } : prev))
    } catch (err) {
      setError(err?.message || 'Failed to start live class')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">Live Class Details</h1>
          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={onBack}
            >
              Live Class
            </button>
            <span className="text-secondary-light"> / Details</span>
          </div>
        </div>
        <button type="button" className="btn btn-light border d-flex align-items-center gap-6" onClick={onBack}>
          <i className="ri-arrow-left-line"></i>
          Back
        </button>
      </div>

      {loading ? <div className="card p-24 text-secondary-light">Loading...</div> : null}
      {error ? <div className="alert alert-danger py-10">{error}</div> : null}

      {liveClass ? (
        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-16 mb-24">
              <div>
                <h2 className="h6 fw-semibold text-primary-light mb-6">{liveClass.subjectName}</h2>
                <p className="text-secondary-light mb-0">
                  {liveClass.className} / {liveClass.sectionName} with {liveClass.teacherName}
                </p>
              </div>
              <div className="d-flex gap-10 flex-wrap">
                {isLiveKit ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-light border d-flex align-items-center gap-6"
                      disabled={actionLoading || String(liveClass.status || '').toLowerCase() === 'live'}
                      onClick={handleStart}
                      title="Teacher/Admin only"
                    >
                      <i className="ri-broadcast-line"></i>
                      Start Live
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary-600 d-flex align-items-center gap-6"
                      disabled={actionLoading || String(liveClass.status || '').toLowerCase() !== 'live'}
                      onClick={() => setShowLiveKitRoom(true)}
                    >
                      <i className="ri-video-on-line"></i>
                      Join Live
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary-600 d-flex align-items-center gap-6"
                    disabled={!liveClass.meetingLink}
                    onClick={() => setShowMeeting(true)}
                  >
                    <i className="ri-video-on-line"></i>
                    Join Meeting
                  </button>
                )}
              </div>
            </div>

            <div className="d-grid grid-cols-3 gap-20 mb-24">
              <DetailItem label="School" value={liveClass.schoolName} />
              <DetailItem label="Type" value={liveClass.liveClassType} />
              <DetailItem label="Status" value={liveClass.status} />
              <DetailItem label="Date" value={liveClass.classDate} />
              <DetailItem label="Start Time" value={liveClass.startTime} />
              <DetailItem label="End Time" value={liveClass.endTime} />
            </div>

            {liveClass.note ? (
              <div className="border-top border-neutral-200 pt-16 mb-24">
                <span className="text-sm text-secondary-light d-block mb-6">Note</span>
                <p className="mb-0 text-primary-light">{liveClass.note}</p>
              </div>
            ) : null}

            {showLiveKitRoom && isLiveKit ? (
              <div className="border-top border-neutral-200 pt-16">
                <MeetingRoom liveClassId={liveClassId} onLeave={() => setShowLiveKitRoom(false)} />
              </div>
            ) : null}

            {showMeeting && liveClass.meetingLink ? (
              <div className="border-top border-neutral-200 pt-16">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-12 mb-12">
                  <span className="fw-semibold text-primary-light">Meeting View</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border d-flex align-items-center gap-6"
                    onClick={() => window.open(liveClass.meetingLink, '_blank', 'noopener,noreferrer')}
                  >
                    <i className="ri-external-link-line"></i>
                    Open Meeting
                  </button>
                </div>
                <iframe
                  title="Live class meeting"
                  src={liveClass.meetingLink}
                  style={{ width: '100%', minHeight: 520, border: '1px solid #e5e7eb', borderRadius: 8 }}
                  allow="camera; microphone; fullscreen; display-capture"
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default LiveClassDetail
